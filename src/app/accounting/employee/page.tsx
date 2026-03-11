'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, Tag, Avatar, ConfigProvider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';
import EmployeeModal from '@/components/accounting/employee/EmployeeModal';
import { employeeApi } from '@/utils/api';

const { Title } = Typography;

export default function EmployeePage() {
    const [currentRoleCode, setCurrentRoleCode] = useState<string | undefined>(undefined);

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    // Selection state
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const STAFF_ROLES = 'NHAN_VIEN_KINH_DOANH,TRUONG_PHONG_CAP_CAO,TRUONG_PHONG,QUAN_LY';

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Nếu không có roleCode (tab Nhân viên) → gọi với 4 role gộp
            // Nếu có roleCode cụ thể (Trưởng khu vực, etc.) → filter theo role đó
            const roleCode = currentRoleCode || STAFF_ROLES;
            const data = await employeeApi.getEmployees({ roleCode });
            setEmployees(data || []);
        } catch (error: any) {
            message.error(error.message || 'Không thể tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    // Read roleCode from sessionStorage (set by sidebar navigation)
    useEffect(() => {
        const stored = sessionStorage.getItem('employeeRoleCode');
        setCurrentRoleCode(stored || undefined);
    }, []);

    // Re-fetch when currentRoleCode changes
    useEffect(() => {
        fetchEmployees();
    }, [currentRoleCode]);

    // Listen for custom event dispatched from same-tab sidebar navigation
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

    const handleEditClick = (record: any) => {
        setEditingEmployee(record);
        setIsModalOpen(true);
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
            if (editingEmployee) {
                await employeeApi.updateEmployee(editingEmployee.id, values);
                message.success('Cập nhật thành công');
            } else {
                await employeeApi.createEmployee(values);
                message.success('Thêm nhân viên thành công');
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
            render: (text: any, record: any, index: number) => index + 1,
        },
        {
            title: 'Mã NV',
            dataIndex: 'employeeCode',
            key: 'employeeCode',
            width: 100,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'avatar',
            key: 'avatar',
            render: () => <Avatar icon={<UserOutlined />} src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />
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
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEditClick(record)}
                    />
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
                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedRowKeys.length} nhân viên`}
                            description="Bạn có chắc chắn muốn xóa những nhân viên đã chọn?"
                            onConfirm={handleBulkDelete}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button danger type="primary" icon={<DeleteOutlined />}>
                                Xóa đã chọn ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
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
                    pagination={{ pageSize: 10 }}
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
        </div>
    );
}
