'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, ConfigProvider, Badge, App, Input, Select, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MinusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { contractApi } from '@/utils/api';
import dayjs from 'dayjs';
import ContractDetailModal from '@/components/contracts/ContractDetailModal';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function ContractListPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [viewContractId, setViewContractId] = useState<string | null>(null);
    const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);

    const contractTypes = React.useMemo(() => {
        const types = Array.from(new Set(contracts.map(c => c.type).filter(Boolean)));
        return types.map(t => ({ label: String(t), value: String(t) }));
    }, [contracts]);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            const data = await contractApi.getContracts();
            if (Array.isArray(data)) {
                setContracts(data);
            } else if (data && Array.isArray(data.data)) {
                setContracts(data.data);
            } else if (data && Array.isArray(data.items)) {
                setContracts(data.items);
            } else {
                setContracts([]);
            }
        } catch (error: any) {
            message.error(error.message || 'Lỗi tải danh sách hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await contractApi.deleteContract(id);
            message.success('Xóa hợp đồng thành công');
            fetchContracts();
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi xóa hợp đồng');
        }
    };

    const displayContracts = React.useMemo(() => {
        let result = contracts;

        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            result = result.filter(item =>
                item.contractCode?.toLowerCase().includes(lowerSearch) ||
                item.regionCode?.toLowerCase().includes(lowerSearch) ||
                item.title?.toLowerCase().includes(lowerSearch)
            );
        }

        if (selectedType) {
            result = result.filter(item => item.type === selectedType);
        }

        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            result = result.filter(item => {
                if (!item.submissionDate) return false;
                const d = dayjs(item.submissionDate);
                return (d.isAfter(start) || d.isSame(start)) && (d.isBefore(end) || d.isSame(end));
            });
        }

        return result;
    }, [contracts, searchText, selectedType, dateRange]);

    const columns: ColumnsType<any> = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 60,
        },
        {
            title: 'Mã hợp đồng',
            dataIndex: 'contractCode',
            key: 'contractCode',
            width: 150,
        },
        {
            title: 'Tên hợp đồng',
            dataIndex: 'title',
            key: 'title',
            width: 250,
            render: (text: string, record: any) => {
                const isShared = record.contractEmployees?.length > 1;
                if (isShared) {
                    return (
                        <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                            {text} (share)
                        </Text>
                    );
                }
                return text;
            }
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            width: 100,
        },
        {
            title: 'Khu vực',
            dataIndex: 'regionCode',
            key: 'regionCode',
            width: 100,
            render: (text: string) => text || '-',
        },
        {
            title: 'Ngày nộp',
            dataIndex: 'submissionDate',
            key: 'submissionDate',
            width: 150,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Tổng giá trị',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            render: (val: any) => {
                if (!val) return '-';
                return new Intl.NumberFormat('vi-VN').format(Number(val)) + ' ₫';
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 50,
            align: 'center',
            filters: [
                { text: 'Đang thực hiện', value: 'ACTIVE' },
                { text: 'Chờ xử lý', value: 'PENDING' },
                { text: 'Đã hoàn thành', value: 'COMPLETED' }
            ],
            onFilter: (value: any, record: any) => record.status === value,
            render: (status: string) => {
                const getColor = () => {
                    if (status === 'COMPLETED') return 'green';
                    if (status === 'PENDING') return 'gold';
                    if (status === 'ACTIVE') return 'blue';
                    return 'default';
                };

                return (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Badge
                            color={getColor()}
                            style={{
                                transform: 'scale(1.4)',
                            }}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: '#52c41a' }} />}
                        onClick={() => {
                            setViewContractId(record.id);
                            setViewReceiptId(null);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => router.push(`/accounting/contracts/${record.id}`)}
                    />
                    <Popconfirm
                        title="Xóa hợp đồng"
                        description="Bạn có chắc chắn muốn xóa hợp đồng này?"
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

    const expandedRowRender = (contract: any) => {
        const nestedColumns: ColumnsType<any> = [
            {
                title: 'Đợt nộp',
                dataIndex: 'name',
                key: 'name',
                render: (text: string) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
            },
            {
                title: 'Số tiền',
                dataIndex: 'amount',
                key: 'amount',
                render: (val: any) => (val != null ? Number(val).toLocaleString('vi-VN') + ' ₫' : '-')
            },
            {
                title: 'Ngày nộp',
                dataIndex: 'paidDate',
                key: 'paidDate',
                render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-')
            },
            {
                title: 'Số phiếu thu',
                dataIndex: 'receiptCode',
                key: 'receiptCode',
            },
            {
                title: 'Thao tác',
                key: 'action',
                width: 100,
                render: (_, receipt) => (
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ color: '#52c41a' }} />}
                        onClick={() => {
                            setViewContractId(contract.id);
                            setViewReceiptId(receipt.id);
                        }}
                    >
                        Chi tiết
                    </Button>
                )
            }
        ];

        return (
            <div style={{ padding: '0 16px 16px 60px' }}>
                <Table
                    columns={nestedColumns}
                    dataSource={contract.receipts || []}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    bordered={false}
                    style={{ background: '#f9f9f9', borderRadius: '4px' }}
                />
            </div>
        );
    };

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: 'calc(100vh - 150px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>
                    Danh sách kế toán (Hợp đồng)
                </Title>
                <Space>
                    <Input.Search
                        placeholder="Tìm kiếm mã HĐ, khu vực..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <Select
                        placeholder="Loại hợp đồng"
                        allowClear
                        value={selectedType}
                        onChange={(val) => setSelectedType(val)}
                        options={contractTypes}
                        style={{ width: 150 }}
                    />
                    <RangePicker
                        format="DD/MM/YYYY"
                        value={dateRange as any}
                        onChange={(dates: any) => setDateRange(dates)}
                        style={{ width: 250 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => router.push('/accounting/contracts/create')}
                        style={{ background: '#d32f2f', borderColor: '#d32f2f' }}
                    >
                        Thêm kế toán mới
                    </Button>
                </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Space size="large" wrap>
                    <Text strong>Trạng thái hợp đồng:</Text>
                    <Badge color="blue" text="Đang thực hiện" />
                    <Badge color="gold" text="Chờ xử lý" />
                    <Badge color="green" text="Đã hoàn thành" />
                </Space>
            </div>

            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            headerBg: '#f3db55',
                            headerColor: '#000000',
                            headerBorderRadius: 8,
                        },
                    },
                }}
            >
                <Table
                    columns={columns}
                    dataSource={displayContracts.map((item: any, index: number) => ({ ...item, stt: index + 1 }))}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 15 }}
                    expandable={{
                        expandedRowRender,
                        rowExpandable: (record) => record.receipts && record.receipts.length > 1,
                        expandIcon: ({ expanded, onExpand, record }) => {
                            if (!record.receipts || record.receipts.length <= 1) return <span style={{ width: 28, display: 'inline-block' }} />;
                            return (
                                <div
                                    onClick={e => onExpand(record, e)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        background: expanded ? '#fff1f0' : '#e6f7ff',
                                        border: `1px solid ${expanded ? '#ffa39e' : '#91d5ff'}`,
                                        color: expanded ? '#f5222d' : '#1890ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {expanded ? <MinusOutlined style={{ fontSize: '12px' }} /> : <PlusOutlined style={{ fontSize: '12px' }} />}
                                </div>
                            );
                        }
                    }}
                />
            </ConfigProvider>

            <ContractDetailModal
                open={!!viewContractId}
                contractId={viewContractId}
                selectedReceiptId={viewReceiptId}
                onClose={() => {
                    setViewContractId(null);
                    setViewReceiptId(null);
                }}
            />
        </div>
    );
}
