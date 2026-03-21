'use client';
import React from 'react';
import { Modal, Descriptions, Tag, Divider, Empty, Button, message, App } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface CustomerDetailModalProps {
    open: boolean;
    customer: any;
    onCancel: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
    open, customer, onCancel }) => {
    const { message: messageApi } = App.useApp();
    if (!customer) return null;

    const handleCopy = () => {
        const info = [
            `Mã khách hàng: ${customer.code || '-'}`,
            `Họ và tên: ${customer.fullName}`,
            `Số điện thoại: ${customer.phone || '-'}`,
            `Người đại diện: ${customer.representative || '-'}`,
            `Mã số thuế: ${customer.taxCode || '-'}`,
            `Ngày sinh: ${customer.dob ? dayjs(customer.dob).format('DD/MM/YYYY') : '-'}`,
            `Địa chỉ: ${customer.address || '-'}`
        ].join('\n');

        navigator.clipboard.writeText(info)
            .then(() => {
                messageApi.success('Đã sao chép thông tin khách hàng');
            })
            .catch(err => {
                console.error('Lỗi khi sao chép:', err);
                messageApi.error('Không thể sao chép thông tin');
            });
    };

    return (
        <Modal
            title="Chi tiết khách hàng"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="close" type="primary" onClick={onCancel}>
                    Đóng
                </Button>
            ]}
            width={800}
            destroyOnHidden
            styles={{ body: { padding: 0 } }}
        >
            <div data-lenis-prevent="true" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
                <Descriptions
                    title="Thông tin cơ bản"
                    bordered
                    column={2}
                    extra={
                        <Button type="primary" ghost icon={<CopyOutlined />} onClick={handleCopy}>
                            Sao chép thông tin
                        </Button>
                    }
                >
                    <Descriptions.Item label="Họ và tên">
                        <strong>{customer.fullName}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Người đại diện">
                        {customer.representative}
                    </Descriptions.Item>

                    <Descriptions.Item label="Số điện thoại">
                        {customer.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã số thuế">
                        {customer.taxCode}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày sinh" span={2}>
                        {customer.dob ? dayjs(customer.dob).format('DD/MM/YYYY') : '-'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Địa chỉ" span={2}>
                        {customer.address || '-'}
                    </Descriptions.Item>
                </Descriptions>
                <Divider titlePlacement='start'>Danh sách hợp đồng</Divider>
                {customer.contracts && customer.contracts.length > 0 ? (
                    customer.contracts.map((contract: any, index: number) => (
                        <Descriptions
                            key={contract.id || index}
                            bordered
                            size="small"
                            column={2}
                            style={{ marginBottom: 16 }}
                        >
                            <Descriptions.Item label="Mã hợp đồng">
                                <Tag color="blue">{contract.contractCode}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại hợp đồng">{contract.type}</Descriptions.Item>
                            <Descriptions.Item label="Tên hợp đồng" span={2}>{contract.title}</Descriptions.Item>
                            <Descriptions.Item label="Ngày nộp">
                                {contract.submissionDate ? dayjs(contract.submissionDate).format('DD/MM/YYYY') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={contract.status === 'ACTIVE' ? 'green' : 'orange'}>
                                    {contract.status || 'N/A'}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    ))
                ) : (
                    <Empty description="Chưa có hợp đồng nào" />
                )}
            </div>
        </Modal>
    )
}

export default CustomerDetailModal