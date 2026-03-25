import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Spin, App, Button, Tabs, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractApi } from '@/utils/api';

const { Title, Text } = Typography;

interface ContractDetailModalProps {
    open: boolean;
    contractId: string | null;
    selectedReceiptId?: string | null;
    onClose: () => void;
}

export default function ContractDetailModal({ open, contractId, selectedReceiptId, onClose }: ContractDetailModalProps) {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const loadContract = async () => {
        try {
            setLoading(true);
            const res = await contractApi.getContractById(contractId as string);
            if (res) {
                setData(res);
            }
            setLoading(false);
        } catch (error: any) {
            message.error(error.message || 'Không thể tải thông tin hợp đồng');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && contractId) {
            loadContract();
        } else {
            setData(null);
        }
    }, [open, contractId]);

    const handleCopy = () => {
        if (!data) return;
        const mainEmp = data.contractEmployees?.find((ce: any) => ce.isMain)?.employee;
        const shareEmp = data.contractEmployees?.find((ce: any) => !ce.isMain)?.employee;
        const selectedReceipt = selectedReceiptId ? data.receipts?.find((r: any) => r.id === selectedReceiptId) : null;

        let copyText = `--- THÔNG TIN HỢP ĐỒNG ---\n`;
        copyText += `MÃ HỢP ĐỒNG: ${data.contractCode || ''}${selectedReceipt ? ` - ${selectedReceipt.name}` : ''}\n`;
        if (data.signDate) copyText += `NGÀY KÍ: ${dayjs(data.signDate).format('DD/MM/YYYY')}\n`;

        const displayDate = selectedReceipt?.paidDate || data.submissionDate;
        if (displayDate) copyText += `NGÀY NỘP: ${dayjs(displayDate).format('DD/MM/YYYY')}\n`;

        if (data.features) copyText += `CHỨC NĂNG: ${data.features}\n`;
        if (data.note) copyText += `GHI CHÚ: ${data.note}\n`;

        if (mainEmp) copyText += `NHÂN VIÊN KINH DOANH: ${mainEmp.fullName || ''} ${mainEmp.employeeCode ? `- ${mainEmp.employeeCode}` : ''}\n`;
        if (shareEmp) copyText += `NHÂN VIÊN KINH DOANH 2 (SHARE): ${shareEmp.fullName || ''} ${shareEmp.employeeCode ? `- ${shareEmp.employeeCode}` : ''}\n`;
        copyText += `\n`;

        if (data.customer) {
            copyText += `--- THÔNG TIN KHÁCH HÀNG ---\n`;
            if (data.customer.fullName) copyText += `Họ và tên: ${data.customer.fullName}\n`;
            if (data.customer.address) copyText += `Địa chỉ: ${data.customer.address}\n`;
            if (data.customer.phone) copyText += `SĐT: ${data.customer.phone}\n`;
            if (data.customer.email) copyText += `Email: ${data.customer.email}\n`;
            copyText += `\n`;
        }

        copyText += `--- THÔNG TIN TÀI CHÍNH ---\n`;
        const totalPayment = Number(data.totalAmount || 0) + Number(data.vatAmount || 0);
        copyText += `Tổng thanh toán: ${totalPayment.toLocaleString('vi-VN')}đ\n`;
        if (selectedReceipt) {
            copyText += `Số tiền đợt này (${selectedReceipt.name}): ${Number(selectedReceipt.amount || 0).toLocaleString('vi-VN')}đ\n`;
        }
        copyText += `Đã thu (tổng cộng): ${Number(data.paidAmount || 0).toLocaleString('vi-VN')}đ\n`;
        copyText += `Còn lại: ${Number(data.remainingAmount || 0).toLocaleString('vi-VN')}đ\n\n`;

        if (data.services && data.services.length > 0) {
            copyText += `--- DỊCH VỤ ---\n`;
            data.services.forEach((s: any, idx: number) => {
                const servicePrice = s.totalAmount ?? s.total ?? s.price ?? 0;
                copyText += `${idx + 1}. ${s.name} - ${Number(servicePrice).toLocaleString('vi-VN')}đ\n`;
            });
        }

        navigator.clipboard.writeText(copyText.trim())
            .then(() => message.success('Sao chép thành công!'))
            .catch(() => message.error('Sao chép thất bại!'));
    };

    if (!open) return null;

    const renderMoney = (amount: any) => {
        if (amount == null) return '-';
        return Number(amount).toLocaleString('vi-VN') + ' đ';
    };

    const selectedReceipt = selectedReceiptId ? data?.receipts?.find((r: any) => r.id === selectedReceiptId) : null;

    const OverviewTab = (
        <Descriptions column={2} bordered size="small" styles={{ label: { fontWeight: 600, width: '150px' } }}>
            <Descriptions.Item label="Mã hợp đồng" span={2}>
                <Text strong type="danger">{data?.contractCode}{selectedReceipt ? ` - ${selectedReceipt.name}` : ''}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày nộp" span={1}>
                {selectedReceipt
                    ? (selectedReceipt.paidDate ? dayjs(selectedReceipt.paidDate).format('DD/MM/YYYY') : '-')
                    : (data?.submissionDate ? dayjs(data.submissionDate).format('DD/MM/YYYY') : '-')}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày ký" span={1}>{data?.signDate ? dayjs(data.signDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Số phiếu thu" span={2}>{selectedReceipt ? (selectedReceipt.receiptCode || '-') : (data?.receipts?.[0]?.receiptCode || '-')}</Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>{data?.note || '-'}</Descriptions.Item>
            <Descriptions.Item label="Chức năng HĐ" span={2}>{data?.features || '-'}</Descriptions.Item>
            <Descriptions.Item label="Phòng ban" span={2}>{data?.contractEmployees?.find((ce: any) => ce.isMain)?.employee?.department?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Trực thuộc khu vực" span={2}>{data?.region?.name || data?.regionCode || '-'}</Descriptions.Item>
        </Descriptions>
    );

    const CustomerTab = (
        <Descriptions column={1} bordered size="small" styles={{ label: { fontWeight: 600, width: '150px' } }}>
            <Descriptions.Item label="Mã khách hàng">{data?.customer?.customerCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Họ và tên">{data?.customer?.fullName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Tên công ty">{data?.customer?.companyName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Mã số thuế">{data?.customer?.taxCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">{data?.customer?.dob ? dayjs(data?.customer?.dob).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{data?.customer?.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{data?.customer?.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{data?.customer?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="Người đại diện">{data?.customer?.representative || '-'}</Descriptions.Item>
        </Descriptions>
    );

    const FinanceTab = (
        <Descriptions column={2} bordered size="small" styles={{ label: { fontWeight: 600, width: '150px' } }}>
            <Descriptions.Item label="Tổng tiền trước VAT" span={2}>{renderMoney(data?.totalAmount)}</Descriptions.Item>
            <Descriptions.Item label="VAT (%)" span={1}>{data?.vatRate || 0}%</Descriptions.Item>
            <Descriptions.Item label="Số tiền VAT" span={1}>{renderMoney(data?.vatAmount)}</Descriptions.Item>
            <Descriptions.Item label="Tổng thanh toán" span={2}>
                <Text strong>{renderMoney(Number(data?.totalAmount || 0) + Number(data?.vatAmount || 0))}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={selectedReceipt ? `Đã thu (${selectedReceipt.name})` : "Đã thu"} span={1}>
                {renderMoney(selectedReceipt ? selectedReceipt.amount : data?.paidAmount)}
            </Descriptions.Item>
        </Descriptions>
    );

    const ServicesTab = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data?.services?.filter((s: any) => {
                if (Number(s.totalAmount || s.total || s.price) > 0) return true;
                if (s.domainInfo && s.domainInfo.domainName) return true;
                if (s.hostingInfo && (s.hostingInfo.duration || s.hostingInfo.storage)) return true;
                return false;
            })?.map((svc: any, idx: number) => (
                <div key={idx} style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
                    <Title level={5} style={{ marginTop: 0 }}>{svc.name}</Title>
                    <Descriptions column={1} size="small" styles={{ label: { fontWeight: 600 } }}>
                        <Descriptions.Item label="Loại dv">{svc.type}</Descriptions.Item>
                        <Descriptions.Item label="Giá">{renderMoney(svc.price ?? svc.totalAmount ?? svc.total)}</Descriptions.Item>
                        {svc.vatRate > 0 && <Descriptions.Item label="Tiền VAT">{renderMoney(svc.vatRate <= 100 ? ((svc.price ?? svc.totalAmount ?? svc.total) * svc.vatRate / 100) : svc.vatRate)}</Descriptions.Item>}
                        <Descriptions.Item label="Tổng cộng">{renderMoney(svc.totalAmount ?? svc.total ?? svc.price)}</Descriptions.Item>

                        {svc.webInfo?.chucNang && <Descriptions.Item label="Chức năng">{svc.webInfo.chucNang}</Descriptions.Item>}
                        {svc.domainInfo && <Descriptions.Item label="Tên miền">{svc.domainInfo.domainName}</Descriptions.Item>}
                        {svc.hostingInfo && <Descriptions.Item label="Thời gian">{svc.hostingInfo.duration}</Descriptions.Item>}
                    </Descriptions>

                    {data?.receipts?.filter((r: any) => r.serviceId === svc.id)?.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <Text strong>Các đợt thanh toán:</Text>
                            <ul style={{ paddingLeft: '20px', margin: '4px 0 0 0' }}>
                                {data.receipts.filter((r: any) => r.serviceId === svc.id).map((r: any, rIdx: number) => (
                                    <li key={rIdx}>{r.name}: {renderMoney(r.amount)} {r.paidDate ? `(Đã thu: ${dayjs(r.paidDate).format('DD/MM/YYYY')})` : ''}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
            {(!data?.services || data.services.length === 0) && <Text type="secondary">Chưa có dịch vụ nào.</Text>}
        </div>
    );

    const EmployeeTab = (
        <Descriptions column={1} bordered size="small" styles={{ label: { fontWeight: 600, width: '150px' } }}>
            {data?.contractEmployees?.map((ce: any, idx: number) => (
                <Descriptions.Item key={idx} label={ce.isMain ? "NV Chính" : "NV Share"}>
                    {ce.employee?.fullName} ({ce.employee?.employeeCode}) {ce.employee?.department?.name ? `- ${ce.employee?.department?.name}` : ''}
                </Descriptions.Item>
            ))}
            {data?.manager && <Descriptions.Item label="Quản lý">{data.manager.fullName}</Descriptions.Item>}
            {data?.deptManager && <Descriptions.Item label="Trưởng phòng">{data.deptManager.fullName}</Descriptions.Item>}
            {data?.seniorDeptManager && <Descriptions.Item label="Trưởng P.CC">{data.seniorDeptManager.fullName}</Descriptions.Item>}
        </Descriptions>
    );

    const tabItems = [
        { key: 'tong-quan', label: 'Tổng quan', children: OverviewTab },
        { key: 'khach-hang', label: 'Khách hàng', children: CustomerTab },
        { key: 'tai-chinh', label: 'Tài chính', children: FinanceTab },
        { key: 'dich-vu', label: 'Dịch vụ', children: ServicesTab },
        { key: 'nhan-vien', label: 'Nhân sự', children: EmployeeTab },
    ];

    return (
        <Modal
            open={open}
            title={<Title level={4} style={{ margin: 0 }}>Chi tiết hợp đồng</Title>}
            onCancel={onClose}
            width={900}
            footer={[
                <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
                    Sao chép thông tin
                </Button>,
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
            centered
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin /></div>
            ) : data ? (
                <Tabs defaultActiveKey="tong-quan" items={tabItems} />
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><Text type="secondary">Dữ liệu không tồn tại</Text></div>
            )}
        </Modal>
    );
}