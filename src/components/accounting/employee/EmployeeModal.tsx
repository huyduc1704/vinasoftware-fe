import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Row, Col, App, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeApi, regionApi, roleApi } from '@/utils/api';

interface EmployeeModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (values: any) => Promise<void>;
    initialValues?: any;
    title: string;
    currentRoleCode?: string;
}

export default function EmployeeModal({ open, onCancel, onOk, initialValues, title, currentRoleCode }: EmployeeModalProps) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Dropdown list states
    const [regions, setRegions] = useState<any[]>([]);
    const [areaManagers, setAreaManagers] = useState<any[]>([]);
    const [seniorManagers, setSeniorManagers] = useState<any[]>([]);
    const [deptManagers, setDeptManagers] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [allRoles, setAllRoles] = useState<any[]>([]);
    const [selectedRegionCode, setSelectedRegionCode] = useState<string | undefined>(undefined);


    useEffect(() => {
        if (open) {
            const parseEmployees = (data: any): any[] => {
                if (Array.isArray(data)) return data;
                if (data && Array.isArray(data.data)) return data.data;
                if (data && Array.isArray(data.items)) return data.items;
                return [];
            };

            const fetchPromises: Promise<any>[] = [];

            fetchPromises.push(
                regionApi.getRegions().then(data => {
                    const items = data?.data || data?.items || data || [];
                    setRegions(items);
                    return items;
                }).catch(() => { setRegions([]); return []; })
            );

            if (['TRUONG_PHONG_CAP_CAO', 'TRUONG_PHONG', 'QUAN_LY', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'TRUONG_KHU_VUC', limit: 1000 })
                        .then(data => {
                            const items = parseEmployees(data);
                            setAreaManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }
            if (['TRUONG_PHONG', 'QUAN_LY', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG_CAP_CAO', limit: 1000 })
                        .then(data => {
                            const items = parseEmployees(data);
                            setSeniorManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }
            if (['QUAN_LY', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG', limit: 1000 })
                        .then(data => {
                            const items = parseEmployees(data);
                            setDeptManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }
            if (['NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'QUAN_LY', limit: 1000 })
                        .then(data => {
                            const items = parseEmployees(data);
                            setManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }

            fetchPromises.push(
                roleApi.getRoles().then((data: any) => {
                    const items = data?.data || data?.items || data || [];
                    setAllRoles(items);
                    return items;
                }).catch(() => { setAllRoles([]); return []; })
            );

            Promise.all(fetchPromises).then((results) => {
                const fetchedRegions = results[0] || [];
                if (initialValues) {
                    let defaultRegionCode = initialValues.regionCode;
                    if (currentRoleCode === 'TRUONG_KHU_VUC' && initialValues.employeeRegions) {
                        defaultRegionCode = initialValues.employeeRegions.map((er: any) => er.regionCode);
                    } else if (initialValues.employeeRegions && initialValues.employeeRegions.length > 0) {
                        defaultRegionCode = initialValues.employeeRegions[0].regionCode;
                    }

                    const currentRegCode = Array.isArray(defaultRegionCode) ? defaultRegionCode[0] : defaultRegionCode;
                    setSelectedRegionCode(currentRegCode);

                    // Auto-select manager if not present
                    let autoAreaManagerId = initialValues.areaManagerId;
                    if (!autoAreaManagerId && currentRegCode) {
                        const reg = fetchedRegions.find((r: any) => r.code === currentRegCode || r.id === currentRegCode);
                        if (reg) autoAreaManagerId = reg.managerId;
                    }

                    const roleIdsArr = initialValues.user?.usersRoles?.map((ur: any) => ur.roleId) || [];
                    form.setFieldsValue({
                        ...initialValues,
                        regionCode: defaultRegionCode,
                        areaManagerId: autoAreaManagerId,
                        dob: initialValues.dob ? dayjs(initialValues.dob) : null,
                        joinDate: initialValues.joinDate ? dayjs(initialValues.joinDate) : null,
                        roleIds: roleIdsArr.length > 0 ? roleIdsArr[0] : undefined,
                    });
                } else {
                    form.resetFields();
                    if (currentRoleCode && !currentRoleCode.includes(',')) {
                        form.setFieldsValue({ roleCode: currentRoleCode });
                    }
                    setSelectedRegionCode(undefined);
                }
            });
        } else {
            setAreaManagers([]);
            setSeniorManagers([]);
            setDeptManagers([]);
            setManagers([]);
            setAllRoles([]);
            setSelectedRegionCode(undefined);
        }
    }, [open, initialValues, form, currentRoleCode]);


    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const roleIds = values.roleIds ? [values.roleIds] : [];
            const formattedData = {
                ...values,
                roleIds,
                dob: values.dob ? values.dob.toISOString() : null,
                joinDate: values.joinDate ? values.joinDate.toISOString() : null,
                roleCode: values.roleCode || currentRoleCode || null,
            };

            await onOk(formattedData);
            form.resetFields();
            onCancel();
        } catch (error: any) {
            console.error('Validation failed:', error);
            if (error.message) message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if (changedValues.regionCode && currentRoleCode !== 'TRUONG_KHU_VUC') {
            const regionCode = changedValues.regionCode;
            setSelectedRegionCode(regionCode);

            // Auto-select manager
            const selectedRegion = regions.find(r => r.code === regionCode || r.id === regionCode);
            if (selectedRegion && selectedRegion.managerId) {
                form.setFieldsValue({ areaManagerId: selectedRegion.managerId });
            }
        }
    };

    const filteredAreaManagers = areaManagers.filter(m =>
        !selectedRegionCode ||
        m.employeeRegions?.some((er: any) => er.regionCode === selectedRegionCode)
    );

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    return (
        <Modal
            open={open}
            title={title}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            width={800}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="avatarFile"
                            label="Ảnh đại diện (Avatar)"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload name="avatar" listType="picture" maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                            </Upload>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="idFrontFile"
                            label="CCCD Mặt trước"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload name="idFront" listType="picture" maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                            </Upload>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="idBackFile"
                            label="CCCD Mặt sau"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload name="idBack" listType="picture" maxCount={1} beforeUpload={() => false}>
                                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                            </Upload>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="employeeCode" label="Mã nhân viên" rules={[{ required: true, message: 'Vui lòng nhập Mã nhân viên!' }]}>
                            <Input placeholder="VD: EMP001" disabled={!!initialValues} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                            <Input placeholder="Nguyễn Văn A" />
                        </Form.Item>
                    </Col>
                </Row>

                {['NVKD', 'ACCOUNTANT', 'EMPLOYEE'].includes(currentRoleCode || '') && (
                    <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                                    <Input placeholder="abc@gmail.com" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
                                    <Input placeholder="0901234567" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}>
                            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="dob" label="Ngày sinh" rules={[{ required: true, message: 'Vui lòng nhập ngày tháng năm sinh' }]}>
                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="joinDate" label="Ngày tham gia" rules={[{ required: true, message: 'Vui lòng nhập ngày vào công ty' }]}>
                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </>
                )}

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="regionCode" label={currentRoleCode === 'TRUONG_KHU_VUC' ? "Khu vực" : "Chọn Khu vực làm việc"} rules={[{ required: true, message: 'Vui lòng chọn Khu vực!' }]}>
                            <Select
                                placeholder="Chọn khu vực làm việc"
                                mode={currentRoleCode === 'TRUONG_KHU_VUC' ? 'multiple' : undefined}
                                allowClear
                            >
                                {regions.map((r: any) => (
                                    <Select.Option key={r.code || r.id} value={r.code || r.id}>
                                        {r.code || r.id}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="roleCode" label="Chức vụ (Role)" rules={[{ required: true, message: 'Vui lòng chọn chức vụ!' }]}>
                            <Select placeholder="Chọn chức vụ">
                                <Select.Option value="NVKD">Nhân viên kinh doanh</Select.Option>
                                <Select.Option value="QUAN_LY">Quản lý</Select.Option>
                                <Select.Option value="TRUONG_PHONG">Trưởng phòng</Select.Option>
                                <Select.Option value="TRUONG_PHONG_CAP_CAO">Trưởng phòng cấp cao</Select.Option>
                                <Select.Option value="TRUONG_KHU_VUC">Trưởng khu vực</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item hidden name="areaManagerId">
                    <Input />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="roleIds" label="Quyền đăng nhập (Role)">
                            <Select
                                placeholder="Chọn nhóm quyền"
                                allowClear
                            >
                                {allRoles.map((r: any) => (
                                    <Select.Option key={r.id} value={r.id}>
                                        {r.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            name="password" 
                            label={initialValues?.id ? "Đổi mật khẩu (Để trống nếu không đổi)" : "Mật khẩu (Cho tài khoản mới)"}
                            rules={initialValues?.id ? [] : [{ required: false }]} // Backend handles required check if needed
                        >
                            <Input.Password placeholder={initialValues?.id ? "Nhập mật khẩu mới" : "Nhập mật khẩu"} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    {['TRUONG_PHONG', 'QUAN_LY', 'NVKD'].includes(currentRoleCode || '') && (
                        <Col span={8}>
                            <Form.Item name="seniorDeptManagerId" label="Trưởng phòng cấp cao">
                                <Select placeholder="Chọn Trưởng phòng cấp cao" allowClear>
                                    {seniorManagers.map((m: any) => (
                                        <Select.Option key={m.id} value={m.id}>{m.fullName}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    )}
                    {['QUAN_LY', 'NVKD'].includes(currentRoleCode || '') && (
                        <Col span={8}>
                            <Form.Item name="deptManagerId" label="Trưởng phòng">
                                <Select placeholder="Chọn Trưởng phòng" allowClear>
                                    {deptManagers.map((m: any) => (
                                        <Select.Option key={m.id} value={m.id}>{m.fullName}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    )}
                    {['NVKD'].includes(currentRoleCode || '') && (
                        <Col span={8}>
                            <Form.Item name="managerId" label="Quản lý trực tiếp">
                                <Select placeholder="Chọn Quản lý" allowClear>
                                    {managers.map((m: any) => (
                                        <Select.Option key={m.id} value={m.id}>{m.fullName}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    )}
                </Row>
            </Form>
        </Modal>
    );
}
