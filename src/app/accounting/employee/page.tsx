'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';
import EmployeeModal from '@/components/accounting/employee/EmployeeModal';
import { employeeApi } from '@/utils/api';

const { Title } = Typography;

export default function EmployeePage() {
    const searchParams = useSearchParams();
    const currentRoleCode = searchParams?.get('roleCode') || undefined;

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await employeeApi.getEmployees({ roleCode: currentRoleCode });
            setEmployees(data || []);
        } catch (error: any) {
            message.error(error.message || 'Lỗi tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [currentRoleCode]);

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
            throw error; // Let modal handle error display
        }
    };

    const columns: ColumnsType<any> = [
        {

        },
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
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Trưởng khu vực',
            dataIndex: 'areaManager',
            key: 'areaManager',
            render: (areaManager: any) => areaManager?.fullName || '-',
        },
        {
            title: 'Trưởng phòng CC',
            dataIndex: 'seniorDeptManager',
            key: 'seniorDeptManager',
            render: (manager: any) => manager?.fullName || '-',
        },
        {
            title: 'Trưởng phòng',
            dataIndex: 'deptManager',
            key: 'deptManager',
            render: (manager: any) => manager?.fullName || '-',
        },
        {
            title: 'Quản lý',
            dataIndex: 'manager',
            key: 'manager',
            render: (manager: any) => manager?.fullName || '-',
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
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateClick}
                    style={{ background: '#d32f2f', borderColor: '#d32f2f' }}
                >
                    Thêm nhân viên
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={employees}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1200 }}
                pagination={{ pageSize: 10 }}
            />

            <EmployeeModal
                open={isModalOpen}
                title={editingEmployee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
                initialValues={editingEmployee}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleModalSubmit}
                currentRoleCode={currentRoleCode}
            />
        </div>
    );
}
