'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Table, Space, message, Popconfirm, ConfigProvider, Badge, App, Input, Select, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
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

    const flattenedContracts = React.useMemo(() => {
        let flattened: any[] = [];
        contracts.forEach(contract => {
            if (contract.receipts && contract.receipts.length > 0) {
                const isMulti = contract.receipts.length > 1;
                contract.receipts.forEach((receipt: any, index: number) => {
                    flattened.push({
                        ...contract,
                        uniqueKey: `${contract.id}_${receipt.id || index}`,
                        originalId: contract.id,
                        displayContractCode: isMulti ? `${contract.contractCode} - ${receipt.name}` : contract.contractCode,
                        isMultiInstallment: isMulti,
                        displayDate: receipt.paidDate || contract.submissionDate,
                        displayAmount: receipt.amount != null ? receipt.amount : contract.totalAmount
                    });
                });
            } else {
                flattened.push({
                    ...contract,
                    uniqueKey: contract.id,
                    originalId: contract.id,
                    displayContractCode: contract.contractCode,
                    isMultiInstallment: false,
                    displayDate: contract.submissionDate,
                    displayAmount: contract.totalAmount
                });
            }
        });

        let result = flattened;

        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            result = result.filter(item =>
                item.contractCode?.toLowerCase().includes(lowerSearch) ||
                item.regionCode?.toLowerCase().includes(lowerSearch)
            );
        }

        if (selectedType) {
            result = result.filter(item => item.type === selectedType);
        }

        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            result = result.filter(item => {
                if (!item.displayDate) return false;
                const d = dayjs(item.displayDate);
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
            dataIndex: 'displayContractCode',
            key: 'displayContractCode',
            width: 150,
            render: (text: string, record: any) => {
                if (record.isMultiInstallment) {
                    return (
                        <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                            {text}
                        </Text>
                    );
                }
                return text;
            }
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
            dataIndex: 'displayDate',
            key: 'displayDate',
            width: 150,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Tổng giá trị',
            dataIndex: 'displayAmount',
            key: 'displayAmount',
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
                            setViewContractId(record.originalId);
                            setViewReceiptId(record.isMultiInstallment ? record.uniqueKey.split('_')[1] : null);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => router.push(`/accounting/contracts/${record.originalId}`)}
                    />
                    <Popconfirm
                        title="Xóa hợp đồng"
                        description="Bạn có chắc chắn muốn xóa hợp đồng này?"
                        onConfirm={() => handleDelete(record.originalId)}
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
                    dataSource={flattenedContracts.map((item: any, index: number) => ({ ...item, stt: index + 1 }))}
                    rowKey="uniqueKey"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{ pageSize: 15 }}
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
