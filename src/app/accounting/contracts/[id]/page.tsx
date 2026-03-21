'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, DatePicker, Row, Col, Tabs, Typography, Switch, message, ConfigProvider, Space, InputNumber, Spin, App } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { contractApi, customerApi, employeeApi } from '@/utils/api';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ContractDetailPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [showAccountingInfo, setShowAccountingInfo] = useState(true);
    // Store formatted values to apply to form AFTER it mounts
    const [formValues, setFormValues] = useState<any>(null);
    const [isShared, setIsShared] = useState(false);

    // Employee lists for dropdowns
    const [managers, setManagers] = useState({
        area: [] as any[],
        senior: [] as any[],
        dept: [] as any[],
        mgmt: [] as any[],
        staff: [] as any[]
    });

    // Fetch employee lists by role
    useEffect(() => {
        const fetchAllRoles = async () => {
            try {
                const [area, senior, dept, mgmt, staff] = await Promise.all([
                    employeeApi.getEmployees({ roleCode: 'TRUONG_KHU_VUC' }),
                    employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG_CAP_CAO' }),
                    employeeApi.getEmployees({ roleCode: 'TRUONG_PHONG' }),
                    employeeApi.getEmployees({ roleCode: 'QUAN_LY' }),
                    employeeApi.getEmployees({ roleCode: 'NHAN_VIEN_KINH_DOANH' })
                ]);
                const getData = (res: any) => {
                    if (Array.isArray(res)) return res;
                    if (res && Array.isArray(res.data)) return res.data;
                    if (res && Array.isArray(res.items)) return res.items;
                    return [];
                };
                setManagers({
                    area: getData(area),
                    senior: getData(senior),
                    dept: getData(dept),
                    mgmt: getData(mgmt),
                    staff: getData(staff)
                });
            } catch (error) {
                console.error('Failed to fetch employee lists:', error);
            }
        };
        fetchAllRoles();
    }, []);
    useEffect(() => {
        if (!id) return;
        const loadContract = async () => {
            try {
                setPageLoading(true);
                const data = await contractApi.getContractById(id);
                if (data) {
                    const isContractShared = data.contractEmployees?.length > 1;
                    setIsShared(isContractShared);
                    const mainEmployee = data.contractEmployees?.find((ce: any) => ce.isMain) || data.contractEmployees?.[0];
                    const subEmployee = data.contractEmployees?.find((ce: any) => !ce.isMain);
                    const emp = mainEmployee?.employee;
                    const subEmp = subEmployee?.employee;
                    const customer = data.customer;
                    const sd = data.serviceDetails || {};
                    if (Object.keys(sd).length === 0 && Array.isArray(data.services)) {
                        data.services.forEach((s: any) => {
                            const numericTotal = s.total || s.totalAmount ? Number(s.total || s.totalAmount) : undefined;
                            const numericPrice = s.price !== null && s.price !== undefined ? Number(s.price) : undefined;
                            const numericVat = s.vatAmount !== null && s.vatAmount !== undefined ? Number(s.vatAmount) : undefined;
                            const numericVatRate = s.vatRate !== null && s.vatRate !== undefined ? Number(s.vatRate) : undefined;

                            if (s.type === 'WEB') {
                                if (s.name?.toLowerCase().includes('nâng cấp') && !s.name?.toLowerCase().includes('thiết kế')) {
                                    sd.webUpgrade = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, ...s.webInfo };
                                    sd.webUpgradeInfo = { chucNang: s.webInfo?.chucNang };
                                } else {
                                    sd.web = { giaHopDong: numericPrice !== undefined ? numericPrice : numericTotal, vatRate: numericVatRate, tongThanhToan: numericTotal, tongGiaTri: numericTotal, ...s.webInfo };
                                    sd.webInfo = { chucNang: s.webInfo?.chucNang };
                                }
                            } else if (s.type === 'HOSTING') {
                                if (s.name?.toLowerCase().includes('nâng cấp')) {
                                    sd.hostingUpgrade = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, vatAmount: numericVat, hostVat: numericTotal, ...s.hostingInfo };
                                    sd.hostingUpgradeInfo = { thoiGian: s.hostingInfo?.duration, dungLuong: s.hostingInfo?.storage };
                                } else {
                                    sd.hosting = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, vatAmount: numericVat, hostVat: numericTotal, ...s.hostingInfo };
                                    sd.hostingInfo = { thoiGian: s.hostingInfo?.duration, dungLuong: s.hostingInfo?.storage };
                                }
                            } else if (s.type === 'DOMAIN') {
                                sd.domain = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, vatAmount: numericVat, ...s.domainInfo };
                                sd.domainInfo = { diaChiTenMien: s.domainInfo?.domainName, donViDangKy: s.domainInfo?.provider, ngayHetHan: s.domainInfo?.expiryDate ? dayjs(s.domainInfo.expiryDate) : null };
                            } else if (s.type === 'OTHER') {
                                sd.mailServer = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, vatAmount: numericVat, hostVat: numericTotal };
                            } else if (s.type === 'ADS_GG') {
                                sd.ads = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, ...s.adsInfo };
                                sd.adsInfo = { ...s.adsInfo, ngayKichHoat: s.adsInfo?.ngayKichHoat ? dayjs(s.adsInfo.ngayKichHoat) : null, ngayHetHan: s.adsInfo?.ngayHetHan ? dayjs(s.adsInfo.ngayHetHan) : null };
                            } else if (s.type === 'ADS_FB') {
                                sd.facebook = { giaTriHopDong: numericPrice !== undefined ? numericPrice : numericTotal, ...s.facebookInfo };
                                sd.facebookInfo = { ...s.facebookInfo, ngayKichHoat: s.facebookInfo?.ngayKichHoat ? dayjs(s.facebookInfo.ngayKichHoat) : null };
                            }
                        });
                        if (Array.isArray(data.paymentStages) && data.paymentStages.length > 0) {
                            if (!sd.webChiTiet) sd.webChiTiet = {};
                            const stage1 = data.paymentStages.find((p: any) => p.name === 'Lần 1');
                            if (stage1) sd.webChiTiet.dot1 = Number(stage1.amount);
                            const stage2 = data.paymentStages.find((p: any) => p.name === 'Lần 2');
                            if (stage2) sd.webChiTiet.dot2 = Number(stage2.amount);
                            const stage3 = data.paymentStages.find((p: any) => p.name === 'Bàn giao' || p.name?.toLowerCase() === 'bàn giao');
                            if (stage3) sd.webChiTiet.banGiao = Number(stage3.amount);
                        }
                    }

                    // Store formatted values in state — will be applied to form in a
                    // separate useEffect after pageLoading=false so the form is mounted first
                    setFormValues({
                        ...data,
                        customerId: data.customerId,
                        submissionDate: data.submissionDate ? dayjs(data.submissionDate) : null,
                        signDate: data.signDate ? dayjs(data.signDate) : null,
                        displayEmpCode: emp?.employeeCode || '',
                        displayEmpName: emp?.fullName || '',
                        displayDept1Id: emp?.deptManagerId || '',
                        displayEmpCode2: subEmp?.employeeCode || '',
                        displayEmpName2: subEmp?.fullName || '',
                        displayDept2Id: subEmp?.deptManagerId || '',
                        employeeId: mainEmployee?.employeeId || '',
                        // Map manager IDs to form fields
                        topRegionManager: data.managerId || '',
                        topSeniorManager: data.seniorDeptManagerId || '',
                        topDeptManager: data.deptManagerId || '',
                        displayRegion: data.regionCode || '',
                        displayRegion2: data.regionCode || '',
                        serviceDetails: {
                            ...sd,
                            adsInfo: {
                                ...sd.adsInfo,
                                ngayKichHoat: sd.adsInfo?.ngayKichHoat ? dayjs(sd.adsInfo.ngayKichHoat) : null,
                                ngayHetHan: sd.adsInfo?.ngayHetHan ? dayjs(sd.adsInfo.ngayHetHan) : null,
                            },
                            facebookInfo: {
                                ...sd.facebookInfo,
                                ngayKichHoat: sd.facebookInfo?.ngayKichHoat ? dayjs(sd.facebookInfo.ngayKichHoat) : null,
                            },
                            customerInfo: {
                                tenKhachHang: customer?.fullName || '',
                                daiDien: customer?.representative || '',
                                maSoThue: customer?.taxCode || '',
                                soDienThoai: customer?.phone || '',
                                email: customer?.email || '',
                                ngaySinh: customer?.dob ? dayjs(customer.dob) : null,
                                diaChi: customer?.address || '',
                            },
                        },
                    });
                }
            } catch (error: any) {
                message.error(error.message || 'Không thể tải thông tin hợp đồng');
            } finally {
                setPageLoading(false);
            }
        };
        loadContract();
    }, [id]);

    // Apply form values AFTER pageLoading=false so the form is guaranteed to be mounted
    useEffect(() => {
        if (!pageLoading && formValues) {
            const mappedValues = { ...formValues };
            if (managers.dept.length > 0) {
                if (formValues.displayDept1Id) {
                    mappedValues.displayDept = managers.dept.find((m: any) => m.id === formValues.displayDept1Id)?.fullName || '';
                }
                if (formValues.displayDept2Id) {
                    mappedValues.displayDept2 = managers.dept.find((m: any) => m.id === formValues.displayDept2Id)?.fullName || '';
                }
            }
            form.setFieldsValue(mappedValues);
        }
    }, [pageLoading, formValues, managers]);



    const handleValuesChange = (changedValues: any, allValues: any) => {
        const web = changedValues?.serviceDetails?.web;
        if (web) {
            let updates: any = {};
            if (web.giaHopDong !== undefined || web.daThu !== undefined) {
                const giaHopDong = Number(allValues?.serviceDetails?.web?.giaHopDong || 0);
                const daThu = Number(allValues?.serviceDetails?.web?.daThu || 0);
                updates.conLai = Math.max(0, giaHopDong - daThu);
            }
            if (web.tongGiaTri !== undefined || web.vatRate !== undefined) {
                const tongGiaTri = Number(allValues?.serviceDetails?.web?.tongGiaTri || 0);
                const vatRate = Number(allValues?.serviceDetails?.web?.vatRate || 0);
                const vatAmount = vatRate <= 100 ? tongGiaTri * vatRate / 100 : vatRate;
                updates.tongThanhToan = tongGiaTri + vatAmount;
            }
            if (Object.keys(updates).length > 0) {
                form.setFieldsValue({ serviceDetails: { web: { ...allValues?.serviceDetails?.web, ...updates } } });
            }
        }
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const sd = values.serviceDetails || {};

            // Extract customerInfo — if CustomerTab wasn't visited (lazy render), form won't have
            // these values, so fall back to the loaded DB values in formValues
            const customerInfo = sd.customerInfo || formValues?.serviceDetails?.customerInfo;
            const { customerInfo: _ci, ...serviceDetailsToSave } = sd;

            // Helper: remove empty objects/nulls from serviceDetails to avoid wiping real data
            const cleanEmpty = (obj: any): any => {
                if (obj === null || obj === undefined) return undefined;
                if (typeof obj !== 'object') return obj;
                const cleaned: any = {};
                for (const key of Object.keys(obj)) {
                    const val = obj[key];
                    if (val === null || val === undefined) continue;
                    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                        // Recurse; skip if result is empty
                        const sub = cleanEmpty(val);
                        if (sub && Object.keys(sub).length > 0) cleaned[key] = sub;
                    } else {
                        cleaned[key] = val;
                    }
                }
                return cleaned;
            };

            // Serialize dayjs dates inside serviceDetails
            const formattedServiceDetails = cleanEmpty({
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
            });

            // Also merge with existing DB serviceDetails so untouched sections survive
            const existingSD = formValues?.serviceDetails || {};
            const { customerInfo: _existCi, ...existingSDClean } = existingSD;
            const mergedServiceDetails = { ...existingSDClean, ...formattedServiceDetails };

            const services: any[] = [];

            // Map logic for Info to Backend schema names
            const mapWebInfo = (info: any) => info ? { chucNang: info.chucNang } : null;
            const mapHostingInfo = (info: any) => info ? { duration: info.thoiGian, storage: info.dungLuong } : null;
            const mapDomainInfo = (info: any) => info ? { domainName: info.diaChiTenMien, provider: info.donViDangKy, expiryDate: info.ngayHetHan ? (typeof info.ngayHetHan.toISOString === 'function' ? info.ngayHetHan.toISOString() : info.ngayHetHan) : null } : null;

            if (mergedServiceDetails.web?.giaHopDong || mergedServiceDetails.webInfo?.chucNang) {
                services.push({
                    type: 'WEB',
                    name: 'Thiết kế web',
                    price: mergedServiceDetails.web?.giaHopDong || 0,
                    vatRate: mergedServiceDetails.web?.vatRate || 0,
                    totalAmount: mergedServiceDetails.web?.tongThanhToan || mergedServiceDetails.web?.tongGiaTri || mergedServiceDetails.web?.giaHopDong || 0,
                    webInfo: mapWebInfo(mergedServiceDetails.webInfo)
                });
            }
            if (mergedServiceDetails.webUpgrade?.giaTriHopDong || mergedServiceDetails.webUpgradeInfo?.chucNang) {
                services.push({
                    type: 'WEB',
                    name: 'Nâng cấp web',
                    price: mergedServiceDetails.webUpgrade?.giaTriHopDong || 0,
                    totalAmount: mergedServiceDetails.webUpgrade?.giaTriHopDong || 0,
                    webInfo: mapWebInfo(mergedServiceDetails.webUpgradeInfo)
                });
            }
            if (mergedServiceDetails.hosting?.giaTriHopDong || mergedServiceDetails.hostingInfo) {
                services.push({
                    type: 'HOSTING',
                    name: 'Hosting',
                    price: mergedServiceDetails.hosting?.giaTriHopDong || 0,
                    vatAmount: mergedServiceDetails.hosting?.vatAmount || 0,
                    totalAmount: mergedServiceDetails.hosting?.hostVat || mergedServiceDetails.hosting?.giaTriHopDong || 0,
                    hostingInfo: mapHostingInfo(mergedServiceDetails.hostingInfo)
                });
            }
            if (mergedServiceDetails.hostingUpgrade?.giaTriHopDong || mergedServiceDetails.hostingUpgradeInfo) {
                services.push({
                    type: 'HOSTING',
                    name: 'Nâng cấp Hosting',
                    price: mergedServiceDetails.hostingUpgrade?.giaTriHopDong || 0,
                    vatAmount: mergedServiceDetails.hostingUpgrade?.vatAmount || 0,
                    totalAmount: mergedServiceDetails.hostingUpgrade?.hostVat || mergedServiceDetails.hostingUpgrade?.giaTriHopDong || 0,
                    hostingInfo: mapHostingInfo(mergedServiceDetails.hostingUpgradeInfo)
                });
            }
            if (mergedServiceDetails.domain?.giaTriHopDong || mergedServiceDetails.domainInfo) {
                const domainPrice = mergedServiceDetails.domain?.giaTriHopDong || 0;
                const domainVat = mergedServiceDetails.domain?.vatAmount || 0;
                services.push({
                    type: 'DOMAIN',
                    name: 'Tên miền',
                    price: domainPrice,
                    vatAmount: domainVat,
                    totalAmount: domainPrice + domainVat,
                    domainInfo: mapDomainInfo(mergedServiceDetails.domainInfo)
                });
            }
            if (mergedServiceDetails.mailServer?.giaTriHopDong) {
                services.push({
                    type: 'OTHER',
                    name: 'Mail Server',
                    price: mergedServiceDetails.mailServer?.giaTriHopDong || 0,
                    vatAmount: mergedServiceDetails.mailServer?.vatAmount || 0,
                    totalAmount: mergedServiceDetails.mailServer?.hostVat || mergedServiceDetails.mailServer?.giaTriHopDong || 0
                });
            }
            if (mergedServiceDetails.ads?.giaTriHopDong || mergedServiceDetails.adsInfo) {
                services.push({
                    type: 'ADS_GG',
                    name: 'Quảng cáo Ads',
                    price: mergedServiceDetails.ads?.giaTriHopDong || 0,
                    totalAmount: mergedServiceDetails.ads?.giaTriHopDong || 0,
                    adsInfo: mergedServiceDetails.adsInfo || null
                });
            }
            if (mergedServiceDetails.facebook?.giaTriHopDong || mergedServiceDetails.facebookInfo) {
                services.push({
                    type: 'ADS_FB',
                    name: 'Quảng cáo Facebook',
                    price: mergedServiceDetails.facebook?.giaTriHopDong || 0,
                    totalAmount: mergedServiceDetails.facebook?.giaTriHopDong || 0,
                    facebookInfo: mergedServiceDetails.facebookInfo || null
                });
            }

            const paymentStages: any[] = [];
            let paymentOrder = 1;

            const dot1Amount = (mergedServiceDetails.webChiTiet?.dot1 || 0) + (mergedServiceDetails.webUpgrade?.dot1 || 0) + (mergedServiceDetails.ads?.dot1 || 0) + (mergedServiceDetails.facebook?.dot1 || 0);
            if (dot1Amount > 0) paymentStages.push({ name: 'Lần 1', amount: dot1Amount, order: paymentOrder++, paidDate: null });

            const dot2Amount = (mergedServiceDetails.webChiTiet?.dot2 || 0) + (mergedServiceDetails.webUpgrade?.treo50Percent || 0) + (mergedServiceDetails.ads?.dot2 || 0) + (mergedServiceDetails.facebook?.dot2 || 0);
            if (dot2Amount > 0) paymentStages.push({ name: 'Lần 2', amount: dot2Amount, order: paymentOrder++, paidDate: null });

            const banGiaoAmount = (mergedServiceDetails.webChiTiet?.banGiao || 0) + (mergedServiceDetails.webUpgrade?.banGiao || 0);
            if (banGiaoAmount > 0) paymentStages.push({ name: 'Bàn giao', amount: banGiaoAmount, order: paymentOrder++, paidDate: null });

            const contractEmployees = values.employeeId ? [{ employeeId: values.employeeId, isMain: true }] : [];
            const parseId = (id: string) => id ? id : null;

            // Only send fields that exist in the Contracts Prisma schema
            const contractData: Record<string, any> = {
                contractCode: values.contractCode,
                title: values.title,
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
                services: services,
                paymentStages: paymentStages,
                customerId: values.customerId,
                regionCode: values.regionCode,
                managerId: parseId(values.topRegionManager),
                deptManagerId: parseId(values.topDeptManager),
                seniorDeptManagerId: parseId(values.topSeniorManager),
                contractEmployees: contractEmployees,
            };

            // Remove undefined keys to avoid sending null for unchanged fields
            Object.keys(contractData).forEach(key => {
                if (contractData[key] === undefined) delete contractData[key];
            });

            // Run contract update and customer update in parallel
            const promises: Promise<any>[] = [contractApi.updateContract(id, contractData)];

            // Always update the Customer entity when customerId exists
            // Uses form values if CustomerTab was visited, else uses loaded DB values
            const customerId = values.customerId || formValues?.customerId;
            if (customerId && customerInfo) {
                const customerData: Record<string, any> = {
                    fullName: customerInfo.tenKhachHang,
                    representative: customerInfo.daiDien,
                    taxCode: customerInfo.maSoThue,
                    phone: customerInfo.soDienThoai,
                    email: customerInfo.email,
                    dob: customerInfo.ngaySinh
                        ? (typeof customerInfo.ngaySinh.toISOString === 'function'
                            ? customerInfo.ngaySinh.toISOString()
                            : customerInfo.ngaySinh)
                        : null,
                    address: customerInfo.diaChi,
                };
                Object.keys(customerData).forEach(k => {
                    if (customerData[k] === undefined) delete customerData[k];
                });
                promises.push(customerApi.updateCustomer(customerId, customerData));
            }

            await Promise.all(promises);
            message.success('Cập nhật hợp đồng thành công!');
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

    const numField = (namePath: (string | number)[]) => (
        <Form.Item name={namePath} labelCol={{ span: 24 }}>
            <InputNumber style={{ width: '100%' }} placeholder="0"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(v) => v?.replace(/[^\d]/g, '') as any}
            />
        </Form.Item>
    );

    const OverviewTab = (
        <div style={{ padding: '24px', background: '#fff', minHeight: '400px' }}>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={6}><Form.Item name="contractCode" label="SỐ HỢP ĐỒNG"><Input placeholder="Nhập số hợp đồng" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name="submissionDate" label="NGÀY NỘP"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name="signDate" label="NGÀY KÝ HỢP ĐỒNG"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name="receiptCode" label="SỐ PHIẾU THU"><Input placeholder="Nhập số phiếu thu" /></Form.Item></Col>
            </Row>
            <Row gutter={24} style={{ marginTop: '16px' }}>
                <Col xs={24} md={12} xl={6}><Form.Item name="displayEmpCode" label={isShared ? "MÃ NV 1" : "MÃ NHÂN VIÊN"}><Input placeholder="Mã NV" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name="displayEmpName" label={isShared ? "TÊN NVKD 1" : "TÊN NVKD"}><Input placeholder="Tên NVKD" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name="displayDept" label={isShared ? "PHÒNG" : "PHÒNG"}><Input placeholder="Phòng" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name="displayRegion" label="KHU VỰC"><Input placeholder="Khu vực" /></Form.Item></Col>
            </Row>

            {isShared && (
                <Row gutter={24} style={{ marginTop: '16px' }}>
                    <Col xs={24} md={12} xl={6}><Form.Item name="displayEmpCode2" label="MÃ NV 2 (SHARE)"><Input placeholder="Mã NV 2" /></Form.Item></Col>
                    <Col xs={24} md={12} xl={6}><Form.Item name="displayEmpName2" label="TÊN NVKD 2 (SHARE)"><Input placeholder="Tên NVKD 2" /></Form.Item></Col>
                    <Col xs={24} md={12} xl={6}><Form.Item name="displayDept2" label="PHÒNG"><Input placeholder="Phòng" /></Form.Item></Col>
                    <Col xs={24} md={12} xl={6}><Form.Item name="displayRegion2" label="KHU VỰC 2"><Input placeholder="Khu vực 2" /></Form.Item></Col>
                </Row>
            )}
            <Row gutter={24} style={{ marginTop: '16px' }}>
                <Col xs={24}><Form.Item name="note" label="GHI CHÚ"><TextArea rows={2} placeholder="Nhập ghi chú" /></Form.Item></Col>
            </Row>
        </div>
    );

    const WebTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="THIẾT KẾ WEB" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'giaHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'daThu']} label="ĐÃ THU" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'conLai']} label="CÒN LẠI" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'host']} label="HOST" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'giaWeb']} label="WEB" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'giaDomain']} label="TÊN MIỀN" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'tongGiaTri']} label="TỔNG GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'vatRate']} label="VAT (%)" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'web', 'tongThanhToan']} label="TỔNG THANH TOÁN" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <SectionTitle title="CHI TIẾT" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'webChiTiet', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'webChiTiet', 'dot2']} label="ĐỢT 2" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'webChiTiet', 'banGiao']} label="BÀN GIAO" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <SectionTitle title="NÂNG CẤP WEB" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'webUpgrade', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'webUpgrade', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'webUpgrade', 'treo50Percent']} label="TREO 50% NÂNG CẤP" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'webUpgrade', 'banGiao']} label="BÀN GIAO" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
        </div>
    );

    const HostingTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="HOSTING" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'hosting', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'hosting', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'hosting', 'hostVat']} label="HOST+VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <SectionTitle title="NÂNG CẤP HOSTING" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'hostingUpgrade', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'hostingUpgrade', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'hostingUpgrade', 'hostVat']} label="HOST+VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
        </div>
    );

    const DomainTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="TÊN MIỀN" />
            <Row gutter={24}>
                <Col xs={24} xl={12}><Form.Item name={['serviceDetails', 'domain', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} xl={12}><Form.Item name={['serviceDetails', 'domain', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <SectionTitle title="MAIL SERVER" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'mailServer', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'mailServer', 'vatAmount']} label="VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'mailServer', 'hostVat']} label="HOST+VAT" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
        </div>
    );

    const AdsTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <SectionTitle title="QUẢNG CÁO ADS" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'ads', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'ads', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'ads', 'dot2']} label="ĐỢT 2" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
            <SectionTitle title="QUẢNG CÁO FACEBOOK" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'facebook', 'giaTriHopDong']} label="GIÁ TRỊ HỢP ĐỒNG" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'facebook', 'dot1']} label="ĐỢT 1" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'facebook', 'dot2']} label="ĐỢT 2" labelCol={{ span: 24 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(value) => value?.replace(/[^\d]/g, '') as any} />
                </Form.Item></Col>
            </Row>
        </div>
    );

    const CustomerTab = (
        <div style={{ padding: '24px', background: '#fff' }}>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'customerInfo', 'tenKhachHang']} label="TÊN KHÁCH HÀNG" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'customerInfo', 'daiDien']} label="ĐẠI DIỆN" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'customerInfo', 'maSoThue']} label="MÃ SỐ THUẾ" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
            </Row>
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'customerInfo', 'soDienThoai']} label="SỐ ĐIỆN THOẠI" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'customerInfo', 'email']} label="MAIL" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'customerInfo', 'ngaySinh']} label="NGÀY SINH" labelCol={{ span: 24 }}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
            </Row>
            <Row gutter={24}>
                <Col xs={24}><Form.Item name={['serviceDetails', 'customerInfo', 'diaChi']} label="ĐỊA CHỈ" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
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
            <Form.Item name="features" label="CHỨC NĂNG" labelCol={{ span: 24 }}>
                <TextArea rows={3} placeholder="Chức năng" />
            </Form.Item>
            <SectionTitle title="THÔNG TIN HỢP ĐỒNG HOSTING" />
            <Row gutter={24}>
                <Col xs={24} xl={12}><Form.Item name={['serviceDetails', 'hostingInfo', 'thoiGian']} label="THỜI GIAN" labelCol={{ span: 24 }}><Input placeholder="Thời gian" /></Form.Item></Col>
                <Col xs={24} xl={12}><Form.Item name={['serviceDetails', 'hostingInfo', 'dungLuong']} label="DUNG LƯỢNG" labelCol={{ span: 24 }}><Input placeholder="Dung lượng" /></Form.Item></Col>
            </Row>
            <SectionTitle title="THÔNG TIN NÂNG CẤP HỢP ĐỒNG HOSTING" />
            <Row gutter={24}>
                <Col xs={24} xl={12}><Form.Item name={['serviceDetails', 'hostingUpgradeInfo', 'thoiGian']} label="THỜI GIAN" labelCol={{ span: 24 }}><Input placeholder="Thời gian" /></Form.Item></Col>
                <Col xs={24} xl={12}><Form.Item name={['serviceDetails', 'hostingUpgradeInfo', 'dungLuong']} label="DUNG LƯỢNG" labelCol={{ span: 24 }}><Input placeholder="Dung lượng" /></Form.Item></Col>
            </Row>
            <SectionTitle title="THÔNG TIN HỢP ĐỒNG TÊN MIỀN" />
            <Row gutter={24}>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'domainInfo', 'diaChiTenMien']} label="ĐỊA CHỈ TÊN MIỀN" labelCol={{ span: 24 }}><Input placeholder="Địa chỉ tên miền" /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name={['serviceDetails', 'domainInfo', 'donViDangKy']} label="ĐƠN VỊ ĐĂNG KÝ" labelCol={{ span: 24 }}><Input placeholder="Đơn vị đăng ký" /></Form.Item></Col>
            </Row>
            <SectionTitle title="THÔNG TIN HỢP ĐỒNG QUẢNG CÁO ADS" />
            <Row gutter={16}>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'adsInfo', 'tuKhoa']} label="TỪ KHOÁ" labelCol={{ span: 24 }}><Input placeholder="Từ khoá" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'adsInfo', 'ngayKichHoat']} label="NGÀY KÍCH HOẠT" labelCol={{ span: 24 }}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'adsInfo', 'ngayHetHan']} label="NGÀY HẾT HẠN" labelCol={{ span: 24 }}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col xs={24} md={12} xl={6}><Form.Item name={['serviceDetails', 'adsInfo', 'thoiGianChay']} label="THỜI GIAN CHẠY" labelCol={{ span: 24 }}><Input placeholder="Thời gian chạy" /></Form.Item></Col>
            </Row>
            <SectionTitle title="THÔNG TIN HỢP ĐỒNG QUẢNG CÁO FACEBOOK" />
            <Row gutter={16}>
                <Col xs={24} md={12} xl={4}><Form.Item name={['serviceDetails', 'facebookInfo', 'loaiChienDich']} label="LOẠI CHIẾN DỊCH" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
                <Col xs={24} md={12} xl={5}><Form.Item name={['serviceDetails', 'facebookInfo', 'loaiQuangCao']} label="LOẠI QUẢNG CÁO" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
                <Col xs={24} md={12} xl={5}><Form.Item name={['serviceDetails', 'facebookInfo', 'ngayKichHoat']} label="NGÀY KÍCH HOẠT" labelCol={{ span: 24 }}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col xs={24} md={12} xl={5}><Form.Item name={['serviceDetails', 'facebookInfo', 'thoiGianChay']} label="THỜI GIAN CHẠY" labelCol={{ span: 24 }}><Input /></Form.Item></Col>
            </Row>
        </div>
    );

    const tabItems = [
        { key: 'tong-quan', label: 'Tổng quan', children: OverviewTab },
        { key: 'web', label: 'Thiết kế web', children: WebTab },
        { key: 'hosting', label: 'Hosting', children: HostingTab },
        { key: 'domain', label: 'Tên miền / Mail server', children: DomainTab },
        { key: 'ads', label: 'Quảng cáo Ads / Facebook', children: AdsTab },
        { key: 'customer', label: 'Thông tin khách hàng', children: CustomerTab },
        { key: 'contract', label: 'Thông tin hợp đồng', children: ContractTab },
    ];

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" description="Đang tải thông tin hợp đồng..." />
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f5f5', padding: 'clamp(8px, 2vw, 24px)', borderRadius: '8px', minHeight: 'calc(100vh - 100px)' }}>
            <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={handleValuesChange}>
                <div className="form-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#fff', padding: '16px 24px', borderRadius: '8px' }}>
                    <Text style={{ fontWeight: 600, fontSize: '16px' }}>
                        Quản lý kế toán / Kế toán / <span style={{ fontWeight: 800 }}>Chỉnh sửa kế toán</span>
                    </Text>
                    <Space wrap>
                        <Button loading={loading} onClick={() => form.submit()} style={{ borderRadius: '4px', borderColor: '#d9d9d9' }}>Lưu</Button>
                        <Button style={{ background: '#fce254', color: '#000', borderColor: '#fce254' }} onClick={() => form.resetFields()}>Làm mới</Button>
                        <Button type="primary" danger style={{ background: '#ff4d4f' }} onClick={() => router.push('/accounting/contracts')}>Thoát</Button>
                    </Space>
                </div>

                <div style={{ background: '#fff', padding: '20px 24px 0 24px', borderRadius: '8px 8px 0 0', marginTop: '16px' }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12} xl={4}>
                            <Form.Item label="Trưởng khu vực" name="topRegionManager" labelCol={{ span: 24 }}>
                                <Select placeholder="-- Chọn danh mục --" allowClear showSearch optionFilterProp="label">
                                    {managers.area.map(m => <Option key={m.id} value={m.id} label={m.fullName}>{m.fullName}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12} xl={5}>
                            <Form.Item label="Trưởng phòng cấp cao" name="topSeniorManager" labelCol={{ span: 24 }}>
                                <Select placeholder="-- Chọn danh mục --" allowClear showSearch optionFilterProp="label">
                                    {managers.senior.map(m => <Option key={m.id} value={m.id} label={m.fullName}>{m.fullName}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12} xl={5}>
                            <Form.Item label="Trưởng phòng" name="topDeptManager" labelCol={{ span: 24 }}>
                                <Select placeholder="-- Chọn danh mục --" allowClear showSearch optionFilterProp="label">
                                    {managers.dept.map(m => <Option key={m.id} value={m.id} label={m.fullName}>{m.fullName}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12} xl={5}>
                            <Form.Item label="PP kinh doanh" name="topMgmt" labelCol={{ span: 24 }}>
                                <Select placeholder="-- Chọn danh mục --" allowClear showSearch optionFilterProp="label">
                                    {managers.mgmt.map(m => <Option key={m.id} value={m.id} label={m.fullName}>{m.fullName}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12} xl={5}>
                            <Form.Item label="Nhân viên" name="employeeId" labelCol={{ span: 24 }}>
                                <Select placeholder="-- Chọn danh mục --" allowClear showSearch optionFilterProp="label">
                                    {[...managers.staff, ...managers.mgmt, ...managers.dept, ...managers.senior].map(m => (
                                        <Option key={m.id} value={m.id} label={m.fullName}>{m.fullName}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <ConfigProvider theme={{ components: { Tabs: { itemSelectedColor: '#ff4d4f', itemHoverColor: '#ff4d4f' } } }}>
                    <Tabs
                        type="card"
                        items={tabItems}
                        className="contract-tabs"
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

                <div style={{ marginTop: '16px', background: '#fff', padding: '16px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                        <span style={{ marginRight: '8px' }}>•</span>THÔNG TIN KẾ TOÁN
                    </div>
                    <div>
                        <span style={{ marginRight: '8px', color: '#888' }}>Hiển thị</span>
                        <Switch defaultChecked onChange={(checked) => setShowAccountingInfo(checked)} />
                    </div>
                </div>
            </Form>
        </div>
    );
}
