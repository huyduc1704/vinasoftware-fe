import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Row, Col, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeApi, regionApi } from '@/utils/api';

interface EmployeeModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (values: any) => Promise<void>;
    initialValues?: any;
    title: string;
    currentRoleCode?: string;
}

export default function EmployeeModal({ open, onCancel, onOk, initialValues, title, currentRoleCode }: EmployeeModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Dropdown list states
    const [regions, setRegions] = useState<any[]>([]);
    const [areaManagers, setAreaManagers] = useState<any[]>([]);
    const [seniorManagers, setSeniorManagers] = useState<any[]>([]);
    const [deptManagers, setDeptManagers] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
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

            if (['TRUONG_PHONG_CAP_CAO', 'TRUONG_PHONG', 'QUAN_LY', 'NHAN_VIEN_KINH_DOANH', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'TRUONG_KHU_VUC' })
                        .then(data => {
                            const items = parseEmployees(data);
                            setAreaManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }
            if (['TRUONG_PHONG', 'QUAN_LY', 'NHAN_VIEN_KINH_DOANH', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG_CAP_CAO' })
                        .then(data => {
                            const items = parseEmployees(data);
                            setSeniorManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }
            if (['QUAN_LY', 'NHAN_VIEN_KINH_DOANH', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG' })
                        .then(data => {
                            const items = parseEmployees(data);
                            setDeptManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }
            if (['NHAN_VIEN_KINH_DOANH', 'NVKD'].includes(currentRoleCode || '')) {
                fetchPromises.push(
                    employeeApi.getEmployees({ roleCode: 'QUAN_LY' })
                        .then(data => {
                            const items = parseEmployees(data);
                            setManagers(items);
                            return items;
                        })
                        .catch(() => [])
                );
            }

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

                    form.setFieldsValue({
                        ...initialValues,
                        regionCode: defaultRegionCode,
                        areaManagerId: autoAreaManagerId,
                        dob: initialValues.dob ? dayjs(initialValues.dob) : null,
                        joinDate: initialValues.joinDate ? dayjs(initialValues.joinDate) : null,
                    });
                } else {
                    form.resetFields();
                    setSelectedRegionCode(undefined);
                }
            });
        } else {
            setAreaManagers([]);
            setSeniorManagers([]);
            setDeptManagers([]);
            setManagers([]);
            setSelectedRegionCode(undefined);
        }
    }, [open, initialValues, form, currentRoleCode]);


    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const formattedData = {
                ...values,
                dob: values.dob ? values.dob.toISOString() : null,
                joinDate: values.joinDate ? values.joinDate.toISOString() : null,
                roleCode: currentRoleCode || null,
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

                {['NHAN_VIEN_KINH_DOANH', 'ACCOUNTANT', 'EMPLOYEE'].includes(currentRoleCode || '') && (
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
                        <Form.Item name="regionCode" label="Quản lý khu vực" rules={[{ required: true, message: 'Vui lòng chọn Khu vực!' }]}>
                            <Select
                                placeholder="Chọn mã khu vực"
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
                    {currentRoleCode !== 'TRUONG_KHU_VUC' && (
                        <Col span={12}>
                            <Form.Item name="areaManagerId" label="Trưởng khu vực" rules={[{ required: true, message: 'Vui lòng chọn Trưởng khu vực!' }]}>
                                <Select placeholder="Chọn Trưởng khu vực" allowClear>
                                    {filteredAreaManagers.map((m: any) => (
                                        <Select.Option key={m.id} value={m.id}>{m.fullName}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    )}
                    <Col span={12}>
                        <Form.Item name="roleId" label="Role ID (Quyền đăng nhập)">
                            <Input placeholder="Bỏ trống nếu không cấp quyền" />
                        </Form.Item>
                    </Col>
                </Row>

                {!initialValues && (
                    <Form.Item name="password" label="Mật khẩu (Cho tài khoản mới)">
                        <Input.Password placeholder="Nhập mật khẩu" />
                    </Form.Item>
                )}

                <Row gutter={16}>
                    {['TRUONG_PHONG', 'QUAN_LY', 'NHAN_VIEN_KINH_DOANH'].includes(currentRoleCode || '') && (
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
                    {['QUAN_LY', 'NHAN_VIEN_KINH_DOANH'].includes(currentRoleCode || '') && (
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
                    {['NHAN_VIEN_KINH_DOANH'].includes(currentRoleCode || '') && (
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
