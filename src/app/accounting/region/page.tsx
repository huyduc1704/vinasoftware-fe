'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, Tag, ConfigProvider, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import RegionModal from '@/components/accounting/region/RegionModal';
import { regionApi } from '@/utils/api';

const { Title } = Typography;

export default function RegionPage() {
    const { message } = App.useApp();
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<any>(null);

    // Selection state
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const data = await regionApi.getRegions();
            // Handle array or nested array parsing based on previous fallback pattern
            if (Array.isArray(data)) {
                setRegions(data);
            } else if (data && Array.isArray(data.data)) {
                setRegions(data.data);
            } else if (data && Array.isArray(data.items)) {
                setRegions(data.items);
            } else {
                setRegions([]);
            }
        } catch (error: any) {
            message.error(error.message || 'Lỗi tải danh sách khu vực');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegions();
    }, []);



    const handleCreateClick = () => {
        setEditingRegion(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (record: any) => {
        setEditingRegion(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await regionApi.deleteRegion(id);
            message.success('Xóa khu vực thành công');
            fetchRegions();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa khu vực');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            setLoading(true);
            await Promise.all(selectedRowKeys.map((id) => regionApi.deleteRegion(id.toString())));
            message.success(`Đã xóa thành công ${selectedRowKeys.length} khu vực`);
            setSelectedRowKeys([]);
            fetchRegions();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa hàng loạt khu vực');
        } finally {
            setLoading(false);
        }
    };

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const handleModalSubmit = async (values: any) => {
        try {
            if (editingRegion) {
                await regionApi.updateRegion(editingRegion.id, values);
                message.success('Cập nhật thành công');
            } else {
                await regionApi.createRegion(values);
                message.success('Thêm khu vực thành công');
            }
            fetchRegions();
        } catch (error: any) {
            throw error; // Let modal handle error display
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
            title: 'Mã Khu Vực',
            dataIndex: 'code',
            key: 'code',
            width: 150,
        },
        {
            title: 'Tên Khu Vực',
            dataIndex: 'name',
            key: 'name',
            width: 250,
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (text: string) => text || '-',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 150,
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Hoạt động' : 'Tạm khóa'}
                </Tag>
            )
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
                        title="Xóa khu vực"
                        description="Bạn có chắc chắn muốn xóa khu vực này?"
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
                    Danh sách khu vực
                </Title>
                <Space>
                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={`Xóa ${selectedRowKeys.length} khu vực`}
                            description="Bạn có chắc chắn muốn xóa những khu vực đã chọn?"
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
                        Thêm khu vực mới
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
                    dataSource={regions}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 800 }}
                    pagination={{ pageSize: 15 }}
                />
            </ConfigProvider>

            <RegionModal
                open={isModalOpen}
                title={editingRegion ? "Sửa khu vực" : "Thêm khu vực mới"}
                initialValues={editingRegion}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleModalSubmit}
            />
        </div>
    );
}
