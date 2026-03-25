'use client';

import React, { use, useState } from 'react';
import { Form, Input, Select, Button, DatePicker, Row, Col, Tabs, Typography, Switch, message, ConfigProvider, Space, InputNumber, App } from 'antd';
import { useRouter } from 'next/navigation';
import { contractApi } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ContractCreatePage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showAccountingInfo, setShowAccountingInfo] = useState(true);

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if (changedValues?.serviceDetails?.web) {
            const webChanges = changedValues.serviceDetails.web;
            let updates: any = {};

            // Auto-calculate "CÒN LẠI" = "GIÁ TRỊ HỢP ĐỒNG" - "ĐÃ THU"
            if (webChanges.giaTriHopDong !== undefined || webChanges.daThu !== undefined) {
                const giaTriHopDong = Number(allValues?.serviceDetails?.web?.giaTriHopDong || 0);
                const daThu = Number(allValues?.serviceDetails?.web?.daThu || 0);
                updates.conLai = Math.max(0, giaTriHopDong - daThu);
            }

            // Auto-calculate "TỔNG THANH TOÁN" = "TỔNG GIÁ TRỊ" + "VAT"
            if (webChanges.tongGiaTri !== undefined || webChanges.vat !== undefined) {
                const tongGiaTri = Number(allValues?.serviceDetails?.web?.tongGiaTri || 0);
                const vat = Number(allValues?.serviceDetails?.web?.vat || 0);

                // If the user inputs a small number like 8 or 10, treat it as a percentage %. 
                // If it's larger (> 100), assume they typed a flat amount (like 300000).
                const vatAmount = vat <= 100 ? (tongGiaTri * vat / 100) : vat;
                updates.tongThanhToan = tongGiaTri + vatAmount;
            }

            // AUto-calculate "ĐỢT 1 + ĐỢT 2 = BÀN GIAO"

            if (Object.keys(updates).length > 0) {
                form.setFieldsValue({
                    serviceDetails: {
                        web: {
                            ...allValues?.serviceDetails?.web,
                            ...updates
                        }
                    }
                });
            }
        }
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const sd = values.serviceDetails || {};

            // Strip customerInfo (Customer is a separate entity)
            const { customerInfo, ...serviceDetailsToSave } = sd;

            // Serialize dayjs dates inside serviceDetails
            const formattedServiceDetails = {
                ...serviceDetailsToSave,
                adsInfo: {
                    ...sd.adsInfo,
                    ngayKichHoat: sd.adsInfo?.ngayKichHoat ? sd.adsInfo.ngayKichHoat.toISOString() : null,
                    ngayHetHan: sd.adsInfo?.ngayHetHan ? sd.adsInfo.ngayHetHan.toISOString() : null,
                },
                facebookInfo: {
                    ...sd.facebookInfo,
                    ngayKichHoat: sd.facebookInfo?.ngayKichHoat ? sd.facebookInfo.ngayKichHoat.toISOString() : null,
                },
            };

            const services: any[] = [];
            const receipts: any[] = [];
            let paymentOrder = 1;

            // Map logic for Info to Backend schema names
            const mapWebInfo = (info: any) => info ? { chucNang: info.chucNang } : null;
            const mapHostingInfo = (info: any) => info ? { duration: info.thoiGian, storage: info.dungLuong } : null;
            const mapDomainInfo = (info: any) => info ? { domainName: info.diaChiTenMien, provider: info.donViDangKy, expiryDate: info.ngayHetHan ? info.ngayHetHan.toISOString() : null } : null;

            if (formattedServiceDetails.web?.giaHopDong || formattedServiceDetails.webInfo?.chucNang) {
                const id = crypto.randomUUID();
                services.push({
                    id,
                    type: 'WEB',
                    name: 'Thiết kế web',
                    price: formattedServiceDetails.web?.giaHopDong || 0,
                    vatRate: formattedServiceDetails.web?.vatRate || 0,
                    totalAmount: formattedServiceDetails.web?.tongThanhToan || formattedServiceDetails.web?.tongGiaTri || formattedServiceDetails.web?.giaHopDong || 0,
                    webInfo: mapWebInfo(formattedServiceDetails.webInfo)
                });
                const dot1Amount = formattedServiceDetails.webChiTiet?.dot1 || 0;
                if (dot1Amount > 0) receipts.push({ name: 'Lần 1', amount: dot1Amount, serviceId: id, order: paymentOrder++, paidDate: null });
                const dot2Amount = formattedServiceDetails.webChiTiet?.dot2 || 0;
                if (dot2Amount > 0) receipts.push({ name: 'Lần 2', amount: dot2Amount, serviceId: id, order: paymentOrder++, paidDate: null });
                const banGiaoAmount = formattedServiceDetails.webChiTiet?.banGiao || 0;
                if (banGiaoAmount > 0) receipts.push({ name: 'Bàn giao', amount: banGiaoAmount, serviceId: id, order: paymentOrder++, paidDate: null });
            }
            if (formattedServiceDetails.webUpgrade?.giaTriHopDong || formattedServiceDetails.webUpgradeInfo?.chucNang) {
                const id = crypto.randomUUID();
                services.push({
                    id,
                    type: 'WEB',
                    name: 'Nâng cấp web',
                    price: formattedServiceDetails.webUpgrade?.giaTriHopDong || 0,
                    totalAmount: formattedServiceDetails.webUpgrade?.giaTriHopDong || 0,
                    webInfo: mapWebInfo(formattedServiceDetails.webUpgradeInfo)
                });
                const dot1Amount = formattedServiceDetails.webUpgrade?.dot1 || 0;
                if (dot1Amount > 0) receipts.push({ name: 'Lần 1', amount: dot1Amount, serviceId: id, order: paymentOrder++, paidDate: null });
                const dot2Amount = formattedServiceDetails.webUpgrade?.treo50Percent || 0;
                if (dot2Amount > 0) receipts.push({ name: 'Treo 50%', amount: dot2Amount, serviceId: id, order: paymentOrder++, paidDate: null });
                const banGiaoAmount = formattedServiceDetails.webUpgrade?.banGiao || 0;
                if (banGiaoAmount > 0) receipts.push({ name: 'Bàn giao', amount: banGiaoAmount, serviceId: id, order: paymentOrder++, paidDate: null });
            }
            if (formattedServiceDetails.hosting?.giaTriHopDong || formattedServiceDetails.hostingInfo) {
                services.push({
                    type: 'HOSTING',
                    name: 'Hosting',
                    price: formattedServiceDetails.hosting?.giaTriHopDong || 0,
                    vatAmount: formattedServiceDetails.hosting?.vatAmount || 0,
                    totalAmount: formattedServiceDetails.hosting?.hostVat || formattedServiceDetails.hosting?.giaTriHopDong || 0,
                    hostingInfo: mapHostingInfo(formattedServiceDetails.hostingInfo)
                });
            }
            if (formattedServiceDetails.hostingUpgrade?.giaTriHopDong || formattedServiceDetails.hostingUpgradeInfo) {
                services.push({
                    type: 'HOSTING',
                    name: 'Nâng cấp Hosting',
                    price: formattedServiceDetails.hostingUpgrade?.giaTriHopDong || 0,
                    vatAmount: formattedServiceDetails.hostingUpgrade?.vatAmount || 0,
                    totalAmount: formattedServiceDetails.hostingUpgrade?.hostVat || formattedServiceDetails.hostingUpgrade?.giaTriHopDong || 0,
                    hostingInfo: mapHostingInfo(formattedServiceDetails.hostingUpgradeInfo)
                });
            }
            if (formattedServiceDetails.domain?.giaTriHopDong || formattedServiceDetails.domainInfo) {
                const domainPrice = formattedServiceDetails.domain?.giaTriHopDong || 0;
                const domainVat = formattedServiceDetails.domain?.vatAmount || 0;
                services.push({
                    type: 'DOMAIN',
                    name: 'Tên miền',
                    price: domainPrice,
                    vatAmount: domainVat,
                    totalAmount: domainPrice + domainVat,
                    domainInfo: mapDomainInfo(formattedServiceDetails.domainInfo)
                });
            }
            if (formattedServiceDetails.mailServer?.giaTriHopDong) {
                services.push({
                    type: 'OTHER',
                    name: 'Mail Server',
                    price: formattedServiceDetails.mailServer?.giaTriHopDong || 0,
                    vatAmount: formattedServiceDetails.mailServer?.vatAmount || 0,
                    totalAmount: formattedServiceDetails.mailServer?.hostVat || formattedServiceDetails.mailServer?.giaTriHopDong || 0
                });
            }
            if (formattedServiceDetails.ads?.giaTriHopDong || formattedServiceDetails.adsInfo) {
                const id = crypto.randomUUID();
                services.push({
                    id,
                    type: 'ADS_GG',
                    name: 'Quảng cáo Ads',
                    price: formattedServiceDetails.ads?.giaTriHopDong || 0,
                    totalAmount: formattedServiceDetails.ads?.giaTriHopDong || 0,
                    adsInfo: formattedServiceDetails.adsInfo || null
                });
                const dot1Amount = formattedServiceDetails.ads?.dot1 || 0;
                if (dot1Amount > 0) receipts.push({ name: 'Lần 1', amount: dot1Amount, serviceId: id, order: paymentOrder++, paidDate: null });
                const dot2Amount = formattedServiceDetails.ads?.dot2 || 0;
                if (dot2Amount > 0) receipts.push({ name: 'Lần 2', amount: dot2Amount, serviceId: id, order: paymentOrder++, paidDate: null });
            }
            if (formattedServiceDetails.facebook?.giaTriHopDong || formattedServiceDetails.facebookInfo) {
                const id = crypto.randomUUID();
                services.push({
                    id,
                    type: 'ADS_FB',
                    name: 'Quảng cáo Facebook',
                    price: formattedServiceDetails.facebook?.giaTriHopDong || 0,
                    totalAmount: formattedServiceDetails.facebook?.giaTriHopDong || 0,
                    facebookInfo: formattedServiceDetails.facebookInfo || null
                });
                const dot1Amount = formattedServiceDetails.facebook?.dot1 || 0;
                if (dot1Amount > 0) receipts.push({ name: 'Lần 1', amount: dot1Amount, serviceId: id, order: paymentOrder++, paidDate: null });
                const dot2Amount = formattedServiceDetails.facebook?.dot2 || 0;
                if (dot2Amount > 0) receipts.push({ name: 'Lần 2', amount: dot2Amount, serviceId: id, order: paymentOrder++, paidDate: null });
            }

            let finalEmployees: any[] = [];
            if (values.employees && Array.isArray(values.employees)) {
                values.employees.forEach((emp: any, index: number) => {
                    if (emp && emp.employeeCode) {
                        finalEmployees.push({
                            employeeId: emp.employeeCode, // Backend hỗ trợ map từ EmployeeCode sang ID thông qua biến này
                            isMain: index === 0
                        });
                    }
                });
            }

            const parseId = (id: any) => id === undefined ? undefined : (id ? id : null);

            // Xử lý dữ liệu khách hàng
            let reqCustomerData = undefined;
            if (!values.customerId && customerInfo && customerInfo.tenKhachHang) {
                reqCustomerData = {
                    fullName: customerInfo.tenKhachHang,
                    representative: customerInfo.daiDien || undefined,
                    taxCode: customerInfo.maSoThue || undefined,
                    phone: customerInfo.soDienThoai || undefined,
                    email: customerInfo.email || undefined,
                    address: customerInfo.diaChi || undefined,
                };
            }

            // Only send fields that exist in the Contracts Prisma schema
            const contractData: Record<string, any> = {
                contractCode: values.contractCode,
                title: values.contractCode ? `Hợp đồng ${values.contractCode}` : '',
                type: values.type,
                status: values.status,
                receiptCode: values.receiptCode,
                signDate: values.signDate ? values.signDate.toISOString() : null,
                submissionDate: values.submissionDate ? values.submissionDate.toISOString() : null,
                features: values.features,
                note: values.note,
                totalAmount: values.totalAmount,
                vatAmount: values.vatAmount,
                vatRate: values.vatRate,
                paidAmount: values.paidAmount,
                remainingAmount: values.remainingAmount,
                managerId: parseId(values.topRegionManager),
                deptManagerId: parseId(values.topDeptManager),
                seniorDeptManagerId: parseId(values.topSeniorManager),
                services: services,
                receipts: receipts,
                employees: finalEmployees.length > 0 ? finalEmployees : undefined,
                customerId: values.customerId,
                customerData: reqCustomerData,
                regionCode: values.regionCode,
            };

            // Remove undefined keys
            Object.keys(contractData).forEach(key => {
                if (contractData[key] === undefined) delete contractData[key];
            });

            await contractApi.createContract(contractData);
            message.success('Thêm mới hợp đồng thành công!');
            router.push('/accounting/contracts');
        } catch (error: any) {
            message.error(error.message || 'Lỗi lưu thông tin');
        } finally {
            setLoading(false);
        }
    };


    const SectionTitle = ({ title }: { title: string }) => (
        <div style={{ fontWeight: 700, marginTop: '20px', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase' }}>
            <span style={{ marginRight: '8px' }}>•</span>{title}
        </div>
    );

    const OverviewTab = (
        <div style={{ padding: '24px', background: '#fff', minHeight: '400px' }}>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={4}>
                    <Form.Item name="contractCode" label="SỐ HỢP ĐỒNG">
                        <Input placeholder="Nhập số hợp đồng" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={4}>
                    <Form.Item name="type" label="LOẠI HỢP ĐỒNG" initialValue="WEB">
                        <Select placeholder="Chọn loại hợp đồng">
                            <Option value="WEB">WEB</Option>
                            <Option value="HOSTING">HOSTING</Option>
                            <Option value="DOMAIN">DOMAIN</Option>
                            <Option value="ADS">ADS</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Form.Item name="submissionDate" label="NGÀY NỘP">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Form.Item name="signDate" label="NGÀY KÝ HỢP ĐỒNG">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name="receiptCode" label="SỐ PHIẾU THU">
                        <Input placeholder="Nhập số phiếu thu" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.List name="employees">
                {(fields, { add, remove }) => (
                    <div style={{ marginTop: '16px' }}>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <div key={key} style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', marginBottom: '16px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Text strong>{index === 0 ? 'NHÂN VIÊN KINH DOANH CHÍNH' : `NHÂN VIÊN SHARE ${index}`}</Text>
                                    {index > 0 && (
                                        <Button type="text" danger onClick={() => remove(name)}>Xoá</Button>
                                    )}
                                </div>
                                <Row gutter={24}>
                                    <Col xs={24} md={12} xl={6}>
                                        <Form.Item {...restField} name={[name, 'employeeCode']} label="MÃ NHÂN VIÊN ">
                                            <Input placeholder="Mã NV" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12} xl={6}>
                                        <Form.Item {...restField} name={[name, 'displayEmpName']} label="TÊN NVKD">
                                            <Input placeholder="Tên NVKD (tuỳ chọn hiển thị)" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12} xl={6}>
                                        <Form.Item {...restField} name={[name, 'displayDept']} label="PHÒNG">
                                            <Input placeholder="Phòng" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12} xl={6}>
                                        <Form.Item {...restField} name={[name, 'displayRegion']} label="KHU VỰC">
                                            <Input placeholder="Khu vực" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                        <Button type="dashed" onClick={() => add()} block style={{ marginBottom: '16px' }}>
                            + Thêm nhân viên
                        </Button>
                    </div>
                )}
            </Form.List>
            <Row gutter={24} style={{ marginTop: '16px' }}>
                <Col xs={24}>
                    <Form.Item name="note" label="GHI CHÚ">
                        <TextArea rows={2} placeholder="Nhập ghi chú" />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const WebTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="THIẾT KẾ WEB" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'giaHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'daThu']} label="ĐÃ THU" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'conLai']} label="CÒN LẠI" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'host']} label="HOST" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'giaWeb']} label="WEB" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'giaDomain']} label="TÊN MIỀN" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'tongGiaTri']} label="TỔNG GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'vatRate']} label="VAT (%)" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'web', 'tongThanhToan']} label="TỔNG THANH TOÁN" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="CHI TIẾT" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'webChiTiet', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'webChiTiet', 'dot2']} label="ĐỢT 2" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'webChiTiet', 'banGiao']} label="BÀN GIAO" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="NÂNG CẤP WEB" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'webUpgrade', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'webUpgrade', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'webUpgrade', 'treo50Percent']} label="TREO 50% NÂNG CẤP" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'webUpgrade', 'banGiao']} label="BÀN GIAO" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const HostingTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="HOSTING" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'hosting', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'hosting', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'hosting', 'hostVat']} label="HOST+VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>
            <SectionTitle title="NÂNG CẤP HOSTING" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'hostingUpgrade', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'hostingUpgrade', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'hostingUpgrade', 'hostVat']} label="HOST+VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const DomainTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="TÊN MIỀN" />
            <Row gutter={24}>
                <Col xs={24} xl={12}>
                    <Form.Item name={['serviceDetails', 'domain', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} xl={12}>
                    <Form.Item name={['serviceDetails', 'domain', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="MAIL SERVER" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'mailServer', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'mailServer', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'mailServer', 'hostVat']} label="HOST+VAT" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const AdsTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="QUẢNG CÁO ADS" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'ads', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'ads', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'ads', 'dot2']} label="ĐỢT 2" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="QUẢNG CÁO FACEBOOK" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'facebook', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'facebook', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'facebook', 'dot2']} label="ĐỢT 2" labelCol={{ span: 24 }}>
                        <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const CustomerTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'tenKhachHang']} label="TÊN KHÁCH HÀNG" labelCol={{ span: 24 }}><Input /></Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'daiDien']} label="ĐẠI DIỆN" labelCol={{ span: 24 }}><Input /></Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'maSoThue']} label="MÃ SỐ THUẼ" labelCol={{ span: 24 }}><Input /></Form.Item>
                </Col>
            </Row>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'soDienThoai']} label="SỐ ĐIỆN THOẠI" labelCol={{ span: 24 }}><Input /></Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'email']} label="MAIL" labelCol={{ span: 24 }}><Input /></Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'ngaySinh']} label="NGÀY SINH" labelCol={{ span: 24 }}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={24}>
                <Col xs={24}>
                    <Form.Item name={['serviceDetails', 'customerInfo', 'diaChi']} label="ĐỊA CHỈ" labelCol={{ span: 24 }}><Input /></Form.Item>
                </Col>
            </Row>
        </div>
    );

    const ContractTab = (
        <div style={{ padding: '24px', background: '#fff' }}>

            <SectionTitle title="THÔNG TIN HỢP ĐỒNG WEB" />
            <Form.Item name="features" label="CHỨC NĂNG" labelCol={{ span: 24 }}>
                <TextArea rows={3} placeholder="Chức năng" />
            </Form.Item>

            <SectionTitle title="THÔNG TIN HỢP ĐỒNG NÂNG CẤP WEB" />
            <Form.Item name={['serviceDetails', 'webUpgradeInfo', 'chucNang']} label="CHỨC NĂNG" labelCol={{ span: 24 }}>
                <TextArea rows={3} placeholder="Chức năng" />
            </Form.Item>

            <SectionTitle title="THÔNG TIN HỢP ĐỒNG HOSTING" />
            <Row gutter={24}>
                <Col xs={24} xl={12}>
                    <Form.Item name={['serviceDetails', 'hostingInfo', 'thoiGian']} label="THỜI GIAN" labelCol={{ span: 24 }}>
                        <Input placeholder="Thời gian" />
                    </Form.Item>
                </Col>
                <Col xs={24} xl={12}>
                    <Form.Item name={['serviceDetails', 'hostingInfo', 'dungLuong']} label="DUNG LƯỢNG" labelCol={{ span: 24 }}>
                        <Input placeholder="Dung lượng" />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="THÔNG TIN NÂNG CẤP HỢP ĐỒNG HOSTING" />
            <Row gutter={24}>
                <Col xs={24} xl={12}>
                    <Form.Item name={['serviceDetails', 'hostingUpgradeInfo', 'thoiGian']} label="THỜI GIAN" labelCol={{ span: 24 }}>
                        <Input placeholder="Thời gian" />
                    </Form.Item>
                </Col>
                <Col xs={24} xl={12}>
                    <Form.Item name={['serviceDetails', 'hostingUpgradeInfo', 'dungLuong']} label="DUNG LƯỢNG" labelCol={{ span: 24 }}>
                        <Input placeholder="Dung lượng" />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="THÔNG TIN HỢP ĐỒNG TÊN MIỀN" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'domainInfo', 'diaChiTenMien']} label="ĐỊA CHỈ TÊN MIỀN" labelCol={{ span: 24 }}>
                        <Input placeholder="Địa chỉ tên miền" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                    <Form.Item name={['serviceDetails', 'domainInfo', 'donViDangKy']} label="ĐƠN Vị ĐĂNG KÝ" labelCol={{ span: 24 }}>
                        <Input placeholder="Đơn vị đăng ký" />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="THÔNG TIN HỢP ĐỒNG QUẢNG CÁO ADS" />
            <Row gutter={16}>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'adsInfo', 'tuKhoa']} label="TỪ KHOÁ" labelCol={{ span: 24 }}>
                        <Input placeholder="Từ khoá" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'adsInfo', 'ngayKichHoat']} label="NGÀY KÍCH HOẠT" labelCol={{ span: 24 }}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày kích hoạt" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'adsInfo', 'ngayHetHan']} label="NGÀY HẾT HẠN" labelCol={{ span: 24 }}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày hết hạn" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Form.Item name={['serviceDetails', 'adsInfo', 'thoiGianChay']} label="THỜI GIAN CHẠY" labelCol={{ span: 24 }}>
                        <Input placeholder="Thời gian chạy" />
                    </Form.Item>
                </Col>
            </Row>

            <SectionTitle title="THÔNG TIN HỢP ĐỒNG QUẢNG CÁO FACEBOOK" />
            <Row gutter={16}>
                <Col xs={24} md={12} xl={4}>
                    <Form.Item name={['serviceDetails', 'facebookInfo', 'loaiChienDich']} label="LOẠI CHIẾN DỊCH" labelCol={{ span: 24 }}>
                        <Input placeholder="Loại chiến dịch" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Form.Item name={['serviceDetails', 'facebookInfo', 'loaiQuangCao']} label="LOẠI QUẢNG CÁO" labelCol={{ span: 24 }}>
                        <Input placeholder="Loại quảng cáo" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Form.Item name={['serviceDetails', 'facebookInfo', 'ngayKichHoat']} label="NGÀY KÍCH HOẠT" labelCol={{ span: 24 }}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày kích hoạt" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Form.Item name={['serviceDetails', 'facebookInfo', 'thoiGianChay']} label="THỜI GIAN CHẠY" labelCol={{ span: 24 }}>
                        <Input placeholder="Thời gian chạy" />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );



    const tabItems = [
        { key: 'tong-quan', label: 'Tổng quan', children: OverviewTab },
        { key: 'web', label: 'Thiết kế web', children: WebTab },
        { key: 'hosting', label: 'Hosting', children: HostingTab },
        { key: 'domain', label: 'Tên miền/ Mail server', children: DomainTab },
        { key: 'ads', label: 'Quảng cáo ads/ Facebook', children: AdsTab },
        { key: 'customer', label: 'Thông tin khách hàng', children: CustomerTab },
        { key: 'contract', label: 'Thông tin hợp đồng', children: ContractTab },
    ];

    return (
        <div style={{ background: '#f5f5f5', padding: 'clamp(8px, 2vw, 24px)', borderRadius: '8px', minHeight: 'calc(100vh - 100px)' }}>
            <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={handleValuesChange} initialValues={{ employees: [{}] }}>
                {/* Header Sub-Nav */}
                <div className="form-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#fff', padding: '16px 24px', borderRadius: '8px' }}>
                    <Text style={{ fontWeight: 600, fontSize: '16px' }}>Quản lý kế toán / Kế toán / <span style={{ fontWeight: 800 }}>Chỉnh sửa kế toán</span></Text>
                    <Space wrap>
                        <Button onClick={() => form.submit()} style={{ borderRadius: '4px', borderColor: '#d9d9d9' }}>Lưu</Button>
                        <Button style={{ background: '#fce254', color: '#000', borderColor: '#fce254' }} onClick={() => form.resetFields()}>Làm mới</Button>
                        <Button type="primary" danger style={{ background: '#ff4d4f' }} onClick={() => router.push('/accounting/contracts')}>Thoát</Button>
                    </Space>
                </div>

                {/* Main Tabs */}
                <ConfigProvider
                    theme={{
                        components: {
                            Tabs: {
                                // colorBgContainer: '#020202ff',
                                itemSelectedColor: '#ff4d4f',
                                // itemColor: '#ffffffff',
                                itemHoverColor: '#ff4d4f',
                            },
                        },
                    }}
                >
                    <Tabs
                        type="card"
                        items={tabItems}
                        className="contract-tabs"
                        style={{ marginTop: '0' }}
                        tabBarGutter={4}
                        tabBarStyle={{
                            background: '#fce254',
                            borderBottom: 'none',
                            padding: '10px 10px 0 10px',
                            marginBottom: 0,
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                        }}
                    />
                </ConfigProvider>

                {/* Bottom Toggle */}
                <div style={{ marginTop: '16px', background: '#fff', padding: '16px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SectionTitle title="THÔNG TIN KẾ TOÁN" />
                    <div>
                        <span style={{ marginRight: '8px', color: '#888' }}>Hiển thị</span>
                        <Switch defaultChecked={true} onChange={(checked) => setShowAccountingInfo(checked)} />
                    </div>
                </div>
            </Form>
        </div>
    );
}
