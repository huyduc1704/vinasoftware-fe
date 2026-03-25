'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, Popconfirm, Tag, Avatar, ConfigProvider, Input, Tooltip, Select, Row, Col, App, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, EyeOutlined, DownloadOutlined, FallOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';
import EmployeeModal from '@/components/accounting/employee/EmployeeModal';
import EmployeeDetailModal from '@/components/accounting/employee/EmployeeDetailModal';
import { employeeApi } from '@/utils/api';

const { Title } = Typography;

export default function EmployeePage() {
    const { message } = App.useApp();

    const [currentRoleCode, setCurrentRoleCode] = useState<string | undefined>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('employeeRoleCode') || undefined;
        }
        return undefined;
    });

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewingEmployee, setViewingEmployee] = useState<any>(null);

    // Demote state
    const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);
    const [demoteRecord, setDemoteRecord] = useState<any>(null);
    const [selectedDemoteRole, setSelectedDemoteRole] = useState<string | null>(null);
    const [isDemoteLoading, setIsDemoteLoading] = useState(false);

    // Promote state
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteRecord, setPromoteRecord] = useState<any>(null);
    const [selectedPromoteRole, setSelectedPromoteRole] = useState<string | null>(null);
    const [isPromoteLoading, setIsPromoteLoading] = useState(false);

    // Pagination & Search state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');

    // Filter properties
    const [areaManagersList, setAreaManagersList] = useState<any[]>([]);
    const [seniorDeptManagersList, setSeniorDeptManagersList] = useState<any[]>([]);
    const [deptManagersList, setDeptManagersList] = useState<any[]>([]);
    const [managersList, setManagersList] = useState<any[]>([]);

    const [selectedAreaManager, setSelectedAreaManager] = useState<string | undefined>(undefined);
    const [selectedSeniorDeptManager, setSelectedSeniorDeptManager] = useState<string | undefined>(undefined);
    const [selectedDeptManager, setSelectedDeptManager] = useState<string | undefined>(undefined);
    const [selectedManager, setSelectedManager] = useState<string | undefined>(undefined);

    const [filteredManagers, setFilteredManagers] = useState(areaManagersList);
    // Selection state
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const STAFF_ROLES = 'NVKD,TRUONG_PHONG_CAP_CAO,TRUONG_PHONG,QUAN_LY';

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const roleCode = currentRoleCode || STAFF_ROLES;
            const response = await employeeApi.getEmployees({
                roleCode, page, limit, search,
                areaManagerId: selectedAreaManager,
                seniorDeptManagerId: selectedSeniorDeptManager,
                deptManagerId: selectedDeptManager,
                managerId: selectedManager
            });
            if (response && response.data && response.meta) {
                setEmployees(response.data);
                setTotal(response.meta.total);
            } else {
                setEmployees(response || []);
                setTotal(response?.length || 0);
            }
        } catch (error: any) {
            message.error(error.message || 'Không thể tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearch(searchText);
            setPage(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchText]);



    const [isAreaLoading, setIsAreaLoading] = useState(false);
    const [isSeniorLoading, setIsSeniorLoading] = useState(false);
    const [isDeptLoading, setIsDeptLoading] = useState(false);
    const [isMgrLoading, setIsMgrLoading] = useState(false);

    const fetchAreaManagers = async () => {
        if (areaManagersList.length > 0) return;
        setIsAreaLoading(true);
        try {
            const area = await employeeApi.getEmployees({ roleCode: 'TRUONG_KHU_VUC', limit: 1000 });
            setAreaManagersList(area?.data || area || []);
        } finally {
            setIsAreaLoading(false);
        }
    }

    const fetchSeniorDeptManagers = async () => {
        if (seniorDeptManagersList.length > 0) return;
        setIsSeniorLoading(true);
        try {
            const senior = await employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG_CAP_CAO', limit: 1000 });
            setSeniorDeptManagersList(senior?.data || senior || []);
        } finally {
            setIsSeniorLoading(false);
        }
    }

    const fetchDeptManagers = async () => {
        if (deptManagersList.length > 0) return;
        setIsDeptLoading(true);
        try {
            const dept = await employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG', limit: 1000 });
            setDeptManagersList(dept?.data || dept || []);
        } finally {
            setIsDeptLoading(false);
        }
    }

    const fetchManagers = async () => {
        if (managersList.length > 0) return;
        setIsMgrLoading(true);
        try {
            const mgr = await employeeApi.getEmployees({ roleCode: 'QUAN_LY', limit: 1000 });
            setManagersList(mgr?.data || mgr || []);
        } finally {
            setIsMgrLoading(false);
        }
    }

    useEffect(() => {
        fetchEmployees();
    }, [currentRoleCode, page, limit, search, selectedAreaManager, selectedSeniorDeptManager, selectedDeptManager, selectedManager]);

    useEffect(() => {
        const handleRoleChange = () => {
            const stored = sessionStorage.getItem('employeeRoleCode');
            setCurrentRoleCode(stored || undefined);
        };
        window.addEventListener('employeeRoleChanged', handleRoleChange);
        return () => window.removeEventListener('employeeRoleChanged', handleRoleChange);
    }, []);

    const handleCreateClick = () => {
        setEditingEmployee(null);
        setIsModalOpen(true);
    };

    const removeVietnameseTones = (str: string) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
    }

    const handleSearch = (value: string) => {
        const keyword = removeVietnameseTones(value);

        const filtered = areaManagersList.filter((m: any) =>
            removeVietnameseTones(m.fullName).includes(keyword)
        );
        setFilteredManagers(filtered);
    };


    const handleExportExcel = async () => {
        try {
            message.loading({ content: 'Đang xuất file...', key: 'exportExcel' });

            const queryPayload: any = {};

            if (selectedAreaManager) queryPayload.areaManagerId = selectedAreaManager;
            if (selectedSeniorDeptManager) queryPayload.seniorDeptManagerId = selectedSeniorDeptManager;
            if (selectedDeptManager) queryPayload.deptManagerId = selectedDeptManager;
            if (selectedManager) queryPayload.managerId = selectedManager;

            if (currentRoleCode && !currentRoleCode.includes(',')) {
                queryPayload.roleCode = currentRoleCode;
            }

            const blob = await employeeApi.exportExcel(queryPayload);

            // Create object url and trigger download
            const url = window.URL.createObjectURL(blob as Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Employees.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            message.success({ content: 'Xuất file thành công', key: 'exportExcel' });
        } catch (error: any) {
            message.error({ content: error.message || 'Lỗi khi xuất file Excel', key: 'exportExcel' });
        }
    };

    const handleEditClick = (record: any) => {
        setEditingEmployee(record);
        setIsModalOpen(true);
    };

    const getAvailableDemoteRoles = (currentRole: string) => {
        const hierarchy = [
            { code: 'TRUONG_KHU_VUC', name: 'Trưởng khu vực' },
            { code: 'TRUONG_PHONG_CAP_CAO', name: 'Trưởng phòng cấp cao' },
            { code: 'TRUONG_PHONG', name: 'Trưởng phòng' },
            { code: 'QUAN_LY', name: 'Quản lý' },
            { code: 'NVKD', name: 'Nhân viên kinh doanh' }
        ];

        // Find index of current role
        let index = hierarchy.findIndex(r => r.code === currentRole);
        // Special fallback
        if (currentRole === 'NHAN_VIEN_KINH_DOANH') index = 4;

        if (index === -1) return []; // Not found or already lowest

        // Return all roles that are BELOW this role (higher index)
        return hierarchy.slice(index + 1);
    };

    const handleOpenDemoteModal = (record: any) => {
        setDemoteRecord(record);
        setSelectedDemoteRole(null);
        setIsDemoteModalOpen(true);
    };

    const handleDemoteSubmit = async () => {
        if (!demoteRecord || !selectedDemoteRole) {
            message.warning('Vui lòng chọn chức vụ mới');
            return;
        }

        setIsDemoteLoading(true);
        try {
            await employeeApi.updateEmployee(demoteRecord.id, { roleCode: selectedDemoteRole });
            message.success('Giáng chức thành công');
            setIsDemoteModalOpen(false);
            fetchEmployees();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi giáng chức nhân viên');
        } finally {
            setIsDemoteLoading(false);
        }
    };

    const getAvailablePromoteRoles = (currentRole: string) => {
        const hierarchy = [
            { code: 'TRUONG_KHU_VUC', name: 'Trưởng khu vực' },
            { code: 'TRUONG_PHONG_CAP_CAO', name: 'Trưởng phòng cấp cao' },
            { code: 'TRUONG_PHONG', name: 'Trưởng phòng' },
            { code: 'QUAN_LY', name: 'Quản lý' },
            { code: 'NVKD', name: 'Nhân viên kinh doanh' }
        ];

        // Find index of current role
        let index = hierarchy.findIndex(r => r.code === currentRole);
        // Special fallback
        if (currentRole === 'NHAN_VIEN_KINH_DOANH') index = 4;

        if (index <= 0) return []; // Not found or already highest

        // Return all roles that are ABOVE this role (lower index)
        return hierarchy.slice(0, index).reverse(); // Reverse so immediate higher role is first, or keep order. Let's keep original order.
    };

    const handleOpenPromoteModal = (record: any) => {
        setPromoteRecord(record);
        setSelectedPromoteRole(null);
        setIsPromoteModalOpen(true);
    };

    const handlePromoteSubmit = async () => {
        if (!promoteRecord || !selectedPromoteRole) {
            message.warning('Vui lòng chọn chức vụ mới');
            return;
        }

        setIsPromoteLoading(true);
        try {
            await employeeApi.updateEmployee(promoteRecord.id, { roleCode: selectedPromoteRole });
            message.success('Thăng chức thành công');
            setIsPromoteModalOpen(false);
            fetchEmployees();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi thăng chức nhân viên');
        } finally {
            setIsPromoteLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await employeeApi.deleteEmployee(id);
            message.success('Xóa nhân viên thành công');
            fetchEmployees();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa nhân viên');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            setLoading(true);
            await Promise.all(selectedRowKeys.map((id) => employeeApi.deleteEmployee(id.toString())));
            message.success(`Đã xóa thành công ${selectedRowKeys.length} nhân viên`);
            setSelectedRowKeys([]);
            fetchEmployees();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa hàng loạt nhân viên');
        } finally {
            setLoading(false);
        }
    };

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const handleModalSubmit = async (values: any) => {
        try {

            const avatarFile = values.avatarFile?.[0]?.originFileObj;
            const idFrontFile = values.idFrontFile?.[0]?.originFileObj;
            const idBackFile = values.idBackFile?.[0]?.originFileObj;

            const employeeData = { ...values };
            delete employeeData.avatarFile;
            delete employeeData.idFrontFile;
            delete employeeData.idBackFile;

            let employeeId = '';

            if (editingEmployee) {
                await employeeApi.updateEmployee(editingEmployee.id, employeeData);
                employeeId = editingEmployee.id;
                message.success('Cập nhật thành công');
            } else {
                const newEmployee = await employeeApi.createEmployee(employeeData);
                employeeId = newEmployee.id;
                message.success('Thêm nhân viên thành công');
            }

            const uploadPromises = [];
            if (avatarFile) {
                uploadPromises.push(employeeApi.uploadImage(employeeId, 'AVATAR', avatarFile));
            }
            if (idFrontFile) {
                uploadPromises.push(employeeApi.uploadImage(employeeId, 'ID_FRONT', idFrontFile));
            }
            if (idBackFile) {
                uploadPromises.push(employeeApi.uploadImage(employeeId, 'ID_BACK', idBackFile));
            }

            if (uploadPromises.length > 0) {
                try {
                    await Promise.all(uploadPromises);
                    message.success('Đã tải ảnh lên thành công');
                } catch (error) {
                    message.error('Có lỗi xảy ra khi tải ảnh lên');
                }
            }

            fetchEmployees();
        } catch (error: any) {
            throw error;
        }
    };

    const columns: ColumnsType<any> = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 100,
            render: (text: any, record: any, index: number) => (page - 1) * limit + index + 1,
        },
        {
            title: 'Mã NV',
            dataIndex: 'employeeCode',
            key: 'employeeCode',
            width: 100,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'files',
            key: 'avatar',
            render: (files: any[], record: any) => {
                const avatarFile = files?.find((f: any) => f.category === 'AVATAR');
                return <Avatar icon={<UserOutlined />} src={avatarFile ? avatarFile.filePath : `https://api.dicebear.com/7.x/miniavs/svg?seed=${record.employeeCode}`} />;
            }
        },
        {
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: currentRoleCode === 'TRUONG_KHU_VUC' ? 'Quản lý khu vực' : 'Khu vực làm việc',
            dataIndex: 'employeeRegions',
            key: 'employeeRegions',
            render: (employeeRegions: any[]) => {
                if (!employeeRegions || employeeRegions.length === 0) return '-';
                return employeeRegions.map(er => er.region?.code || er.regionCode).join(' | ');
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Hoạt động' : 'Tạm khóa'}
                </Tag>
            )
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'joinDate',
            key: 'joinDate',
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: '#52c41a' }} />}
                        onClick={async () => {
                            try {
                                const details = await employeeApi.getEmployeeById(record.id);
                                setViewingEmployee(details);
                                setIsDetailModalOpen(true);
                            } catch (e: any) {
                                message.error(e.message || 'Lỗi khi lấy thông tin nhân viên');
                            }
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEditClick(record)}
                    />
                    {record.roleCode !== 'TRUONG_KHU_VUC' && (
                        <Tooltip title="Thăng chức">
                            <Button
                                type="text"
                                icon={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                                onClick={() => handleOpenPromoteModal(record)}
                            />
                        </Tooltip>
                    )}
                    {record.roleCode !== 'NHAN_VIEN_KINH_DOANH' && record.roleCode !== 'NVKD' && (
                        <Tooltip title="Giáng chức">
                            <Button
                                type="text"
                                icon={<ArrowDownOutlined style={{ color: '#faad14' }} />}
                                onClick={() => handleOpenDemoteModal(record)}
                            />
                        </Tooltip>
                    )}
                    <Popconfirm
                        title="Xóa nhân viên"
                        description="Bạn có chắc chắn muốn xóa nhân viên này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: 'calc(100vh - 150px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>
                    Danh sách nhân sự
                </Title>
                <Space>
                    <Input.Search
                        placeholder="Tìm kiếm nhân viên..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                    />
                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedRowKeys.length} nhân viên`}
                            description="Bạn có chắc chắn muốn xóa những nhân viên đã chọn?"
                            onConfirm={handleBulkDelete}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button danger type="primary" icon={<DeleteOutlined />}>
                                Xóa ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportExcel}
                    >
                        Export Excel
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateClick}
                        style={{ background: '#d32f2f', borderColor: '#d32f2f' }}
                    >
                        Thêm nhân viên
                    </Button>
                </Space>
            </div>

            {/* Filter Dropdowns */}
            {(!currentRoleCode || currentRoleCode === 'NVKD') && (
                <div style={{ marginBottom: '24px' }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn Trưởng vùng"
                                allowClear
                                value={selectedAreaManager}
                                onChange={(val) => { setSelectedAreaManager(val); setPage(1); }}
                                onOpenChange={(open) => open && fetchAreaManagers()}
                                loading={isAreaLoading}
                                options={areaManagersList.map((m: any) => ({
                                    label: m.fullName,
                                    value: m.id
                                }))}
                                onSearch={handleSearch}
                                showSearch

                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn Trưởng phòng cấp cao"
                                allowClear
                                value={selectedSeniorDeptManager}
                                onChange={(val) => { setSelectedSeniorDeptManager(val); setPage(1); }}
                                onOpenChange={(open) => open && fetchSeniorDeptManagers()}
                                loading={isSeniorLoading}
                                options={seniorDeptManagersList.map((m: any) => ({ label: m.fullName, value: m.id }))}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn Trưởng phòng"
                                allowClear
                                value={selectedDeptManager}
                                onChange={(val) => { setSelectedDeptManager(val); setPage(1); }}
                                onOpenChange={(open) => open && fetchDeptManagers()}
                                loading={isDeptLoading}
                                options={deptManagersList.map((m: any) => ({ label: m.fullName, value: m.id }))}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn Quản lý"
                                allowClear
                                value={selectedManager}
                                onChange={(val) => { setSelectedManager(val); setPage(1); }}
                                onOpenChange={(open) => open && fetchManagers()}
                                loading={isMgrLoading}
                                options={managersList.map((m: any) => ({ label: m.fullName, value: m.id }))}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Col>
                    </Row>
                </div>
            )}

            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            headerBg: '#f3db55', // Màu vàng nền tiêu đề giống thiết kế
                            headerColor: '#000000', // Màu chữ đen
                            headerBorderRadius: 8, // Bo góc tiêu đề
                        },
                        Checkbox: {
                            colorPrimary: '#f3db55',    // Màu nền vàng khi check
                            colorPrimaryHover: '#fce254', // Màu khi hover
                            colorWhite: '#000000',      // Màu dấu tick đen (override class dấu check)
                        }
                    },
                }}
            >
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: onSelectChange,
                    }}
                    columns={columns}
                    dataSource={employees}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng cộng ${total} nhân viên`,
                        onChange: (newPage, newPageSize) => {
                            setPage(newPage);
                            setLimit(newPageSize);
                        }
                    }}
                    locale={{
                        emptyText: 'Không tìm thấy kết quả phù hợp'
                    }}
                />
            </ConfigProvider>

            <EmployeeModal
                open={isModalOpen}
                title={editingEmployee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
                initialValues={editingEmployee}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleModalSubmit}
                currentRoleCode={editingEmployee?.roleCode ?? currentRoleCode}
            />

            <EmployeeDetailModal
                visible={isDetailModalOpen}
                employee={viewingEmployee}
                onClose={() => setIsDetailModalOpen(false)}
            />

            <Modal
                title="Giáng chức nhân viên"
                open={isDemoteModalOpen}
                onOk={handleDemoteSubmit}
                onCancel={() => setIsDemoteModalOpen(false)}
                confirmLoading={isDemoteLoading}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                {demoteRecord && (
                    <div style={{ padding: '10px 0' }}>
                        <p style={{ marginBottom: 16 }}>
                            Bạn đang giáng chức nhân viên <strong>{demoteRecord.fullName}</strong>.
                            Vui lòng chọn chức vụ mới:
                        </p>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Chọn chức vụ"
                            value={selectedDemoteRole}
                            onChange={(val) => setSelectedDemoteRole(val)}
                            options={getAvailableDemoteRoles(demoteRecord.roleCode).map(r => ({
                                label: r.name,
                                value: r.code
                            }))}
                        />
                    </div>
                )}
            </Modal>

            <Modal
                title="Thăng chức nhân viên"
                open={isPromoteModalOpen}
                onOk={handlePromoteSubmit}
                onCancel={() => setIsPromoteModalOpen(false)}
                confirmLoading={isPromoteLoading}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                {promoteRecord && (
                    <div style={{ padding: '10px 0' }}>
                        <p style={{ marginBottom: 16 }}>
                            Bạn đang thăng chức nhân viên <strong>{promoteRecord.fullName}</strong>.
                            Vui lòng chọn chức vụ mới:
                        </p>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Chọn chức vụ"
                            value={selectedPromoteRole}
                            onChange={(val) => setSelectedPromoteRole(val)}
                            options={getAvailablePromoteRoles(promoteRecord.roleCode).map(r => ({
                                label: r.name,
                                value: r.code
                            }))}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
