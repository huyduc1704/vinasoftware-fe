'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, ConfigProvider, Tag, App, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MinusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import gsap from 'gsap';
import CustomerModal from '@/components/customers/CustomerModal';
import { customerApi } from '@/utils/api';
import CustomerDetailModal from '@/components/customers/CustomerDetailModal';
import { debounce } from 'lodash';

const { Title } = Typography;

export default function CustomerPage() {
    const { message } = App.useApp();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    // Selection state
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Expansion State
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
    const [collapsingKeys, setCollapsingKeys] = useState<React.Key[]>([]);

    //
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState<any>(null);

    const fetchCustomers = async (search?: string) => {
        try {
            setLoading(true);
            const data = await customerApi.getCustomers(search ?? searchQuery);
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


    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         fetchCustomers(searchQuery);
    //     }, 300);

    //     return () => clearTimeout(timer);
    // }, [searchQuery]);

    const debouncedFetch = useMemo(
        () => debounce((value: string) => {
            fetchCustomers(value);
        }, 500),
        []
    );

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

    const handleViewClick = (record: any) => {
        setViewingCustomer(record);
        setIsDetailModalOpen(true);
    }

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
            setIsModalOpen(false);
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
            title: 'Khách hàng',
            dataIndex: 'fullName',
            key: 'fullName',
            width: 200,
            render: (text: string) => <strong style={{ color: '#1890ff' }}>{text || 'Đang cập nhật'}</strong>
        },
        {
            title: 'Hợp đồng liên quan',
            key: 'contracts',
            render: (_, record) => {
                const count = record.contracts?.length || 0;
                return count > 0 ? (
                    <Tag color="cyan">{count} hợp đồng</Tag>
                ) : (
                    <Tag color="default">Chưa có</Tag>
                );
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
                        onClick={() => handleViewClick(record)} // Trigger detail modal
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

    // Wrapper Component để apply GSAP Animation khi mở table
    const AnimatedExpandedRow = ({ record, expanded }: { record: any; expanded: boolean }) => {
        const wrapperRef = React.useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (wrapperRef.current) {
                if (expanded) {
                    // Hiệu ứng Fade In - Hiện
                    gsap.fromTo(
                        wrapperRef.current,
                        { opacity: 0, height: 0, y: -20 },
                        { opacity: 1, height: 'auto', y: 0, duration: 0.5, ease: 'power3.out' }
                    );
                } else {
                    // Hiệu ứng Fade Out - Ẩn
                    gsap.to(wrapperRef.current, {
                        opacity: 0,
                        y: -10,
                        scaleY: 0.95,
                        duration: 0.3,
                        ease: 'power2.inOut'
                    });
                }
            }
        }, [expanded]);

        const nestedColumns: ColumnsType<any> = [
            { title: 'Mã HĐ', dataIndex: 'contractCode', key: 'contractCode' },
            { title: 'Tên HĐ', dataIndex: 'title', key: 'title' },
            { title: 'Loại', dataIndex: 'type', key: 'type', render: (text: string) => <Tag color="blue">{text}</Tag> },
            { title: 'Ngày nộp', dataIndex: 'submissionDate', key: 'submissionDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
            {
                title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => {
                    const colors: Record<string, string> = { ACTIVE: 'blue', PENDING: 'gold', COMPLETED: 'green' };
                    return <Tag color={colors[status] || 'default'}>{status}</Tag>;
                }
            }
        ];

        return (
            <div ref={wrapperRef} style={{ overflow: 'hidden', padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                <Table
                    columns={nestedColumns}
                    dataSource={record.contracts || []}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    bordered
                    style={{ background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                />
            </div>
        );
    };

    const expandedRowRender = (record: any, index: number, indent: number, expanded: boolean) => {
        const isCollapsing = collapsingKeys.includes(record.id);
        return <AnimatedExpandedRow record={record} expanded={!isCollapsing} />;
    };

    const handleExpandToggle = (record: any, e: any) => {
        e.stopPropagation();
        const isCurrentlyExpanded = expandedRowKeys.includes(record.id);

        if (isCurrentlyExpanded) {
            setCollapsingKeys(prev => [...prev, record.id]);

            setTimeout(() => {
                setExpandedRowKeys(prev => prev.filter(k => k !== record.id));
                setCollapsingKeys(prev => prev.filter(k => k !== record.id));
            }, 300);
        } else {
            setExpandedRowKeys(prev => [...prev, record.id]);
        }
    };

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
                    <Input.Search
                        placeholder="Tìm tên hoặc số điện thoại..."
                        allowClear
                        enterButton
                        style={{ width: 300 }}
                        value={searchQuery}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchQuery(value);
                            debouncedFetch(value);
                        }}
                        onSearch={(value) => fetchCustomers(value)}
                    />
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
                    expandable={{
                        expandedRowRender,
                        rowExpandable: (record) => record.contracts && record.contracts.length > 0,
                        expandIcon: ({ expanded, onExpand, record }) => {
                            if (!record.contracts || record.contracts.length === 0) return <span style={{ width: 28, display: 'inline-block' }} />;
                            return (
                                <div
                                    onClick={e => onExpand(record, e)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: expanded ? '#fff1f0' : '#e6f7ff',
                                        border: `1px solid ${expanded ? '#ffa39e' : '#91d5ff'}`,
                                        color: expanded ? '#f5222d' : '#1890ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        margin: '0 auto'
                                    }}
                                >
                                    {expanded ? <MinusOutlined style={{ fontSize: '14px' }} /> : <PlusOutlined style={{ fontSize: '14px' }} />}
                                </div>
                            );
                        }
                    }}
                />
            </ConfigProvider>

            <CustomerModal
                open={isModalOpen}
                title={editingCustomer ? "Sửa thông tin khách hàng" : "Thêm khách hàng mới"}
                initialValues={editingCustomer}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleModalSubmit}
            />

            <CustomerDetailModal
                open={isDetailModalOpen}
                customer={viewingCustomer}
                onCancel={() => setIsDetailModalOpen(false)}
            />
        </div>
    );
}
