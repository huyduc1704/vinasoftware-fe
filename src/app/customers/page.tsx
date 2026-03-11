'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, ConfigProvider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import CustomerModal from '@/components/customers/CustomerModal';
import { customerApi } from '@/utils/api';

const { Title } = Typography;

export default function CustomerPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    // Selection state
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerApi.getCustomers();
            if (Array.isArray(data)) {
                setCustomers(data);
            } else if (data && Array.isArray(data.data)) {
                setCustomers(data.data);
            } else if (data && Array.isArray(data.items)) {
                setCustomers(data.items);
            } else {
                setCustomers([]);
            }
        } catch (error: any) {
            message.error(error.message || 'Lỗi tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreateClick = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (record: any) => {
        setEditingCustomer(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await customerApi.deleteCustomer(id);
            message.success('Xóa khách hàng thành công');
            fetchCustomers();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa khách hàng');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            setLoading(true);
            await Promise.all(selectedRowKeys.map((id) => customerApi.deleteCustomer(id.toString())));
            message.success(`Đã xóa thành công ${selectedRowKeys.length} khách hàng`);
            setSelectedRowKeys([]);
            fetchCustomers();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa hàng loạt khách hàng');
        } finally {
            setLoading(false);
        }
    };

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const handleModalSubmit = async (values: any) => {
        try {
            if (editingCustomer) {
                await customerApi.updateCustomer(editingCustomer.id, values);
                message.success('Cập nhật thành công');
            } else {
                await customerApi.createCustomer(values);
                message.success('Thêm khách hàng thành công');
            }
            fetchCustomers();
            setIsModalOpen(false); // Close here when successful explicitly just in case
        } catch (error: any) {
            message.error(error.message || 'Thao tác thất bại');
            throw error;
        }
    };

    const columns: ColumnsType<any> = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 80,
            render: (text: any, record: any, index: number) => index + 1,
        },
        {
            title: 'Phân Loại',
            key: 'type',
            width: 150,
            render: (_, record) => {
                const types = record.contracts?.map((c: any) => c.type).filter(Boolean);
                if (!types || types.length === 0) return '-';
                return types.join(' | ');
            }
        },
        {
            title: 'Mã hợp đồng',
            key: 'contractCode',
            width: 150,
            render: (_, record) => {
                const codes = record.contracts?.map((c: any) => c.contractCode).filter(Boolean);
                if (!codes || codes.length === 0) return '-';
                return codes.join(' | ');
            }
        },
        {
            title: 'Tên HĐ',
            key: 'contractTitle',
            width: 250,
            render: (_, record) => {
                const titles = record.contracts?.map((c: any) => c.title).filter(Boolean);
                if (!titles || titles.length === 0) return '-';
                return titles.join(' | ');
            }
        },
        {
            title: 'Ngày nộp',
            key: 'submissionDate',
            width: 150,
            render: (_, record) => {
                const dates = record.contracts?.map((c: any) => c.submissionDate).filter(Boolean);
                if (!dates || dates.length === 0) return '-';
                return dates.map((d: string) => dayjs(d).format('DD/MM/YYYY')).join(' | ');
            }
        },
        {
            title: 'ĐIỆN THOẠI',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (text: string) => text || '-',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEditClick(record)}
                        style={{ background: '#f0f2f5' }}
                    />
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: '#52c41a' }} />}
                        onClick={() => { /* view logic fallback */ }}
                        style={{ background: '#f6ffed' }}
                    />
                    <Popconfirm
                        title="Xóa khách hàng"
                        description="Bạn có chắc chắn muốn xóa khách hàng này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} style={{ background: '#fff1f0' }} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: 'calc(100vh - 150px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>
                    Danh sách khách hàng
                </Title>
                <Space>
                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedRowKeys.length} khách hàng`}
                            description="Bạn có chắc chắn muốn xóa những khách hàng đã chọn?"
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
                        Thêm khách hàng
                    </Button>
                </Space>
            </div>

            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            headerBg: '#f3db55', // Màu vàng
                            headerColor: '#000000', // Chữ đen
                            headerBorderRadius: 8,
                        },
                        Checkbox: {
                            colorPrimary: '#f3db55',    // Màu nền vàng khi check
                            colorPrimaryHover: '#fce254',
                            colorWhite: '#000000',      // Dấu tick đen
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
                    dataSource={customers}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 15 }}
                />
            </ConfigProvider>

            <CustomerModal
                open={isModalOpen}
                title={editingCustomer ? "Sửa thông tin khách hàng" : "Thêm khách hàng mới"}
                initialValues={editingCustomer}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleModalSubmit}
            />
        </div>
    );
}
