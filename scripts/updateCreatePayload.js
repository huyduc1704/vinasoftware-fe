const fs = require('fs');

const path = 'c:/Users/HuyND/Desktop/vinasoftware-ui/src/app/accounting/contracts/create/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
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

            const services = [];
            if (formattedServiceDetails.web?.giaHopDong || formattedServiceDetails.webInfo?.chucNang) {
                services.push({ type: 'WEB', name: 'Thiết kế web', total: formattedServiceDetails.web?.tongGiaTri || formattedServiceDetails.web?.giaHopDong || 0, webInfo: formattedServiceDetails.webInfo || null });
            }
            if (formattedServiceDetails.webUpgrade?.giaTriHopDong || formattedServiceDetails.webUpgradeInfo?.chucNang) {
                services.push({ type: 'WEB', name: 'Nâng cấp web', total: formattedServiceDetails.webUpgrade?.giaTriHopDong || 0, webInfo: formattedServiceDetails.webUpgradeInfo || null });
            }
            if (formattedServiceDetails.hosting?.giaTriHopDong || formattedServiceDetails.hostingInfo) {
                services.push({ type: 'HOSTING', name: 'Hosting', total: formattedServiceDetails.hosting?.giaTriHopDong || 0, hostingInfo: formattedServiceDetails.hostingInfo || null });
            }
            if (formattedServiceDetails.hostingUpgrade?.giaTriHopDong || formattedServiceDetails.hostingUpgradeInfo) {
                services.push({ type: 'HOSTING', name: 'Nâng cấp Hosting', total: formattedServiceDetails.hostingUpgrade?.giaTriHopDong || 0, hostingInfo: formattedServiceDetails.hostingUpgradeInfo || null });
            }
            if (formattedServiceDetails.domain?.giaTriHopDong || formattedServiceDetails.domainInfo) {
                services.push({ type: 'DOMAIN', name: 'Tên miền', total: formattedServiceDetails.domain?.giaTriHopDong || 0, domainInfo: formattedServiceDetails.domainInfo || null });
            }
            if (formattedServiceDetails.mailServer?.giaTriHopDong) {
                services.push({ type: 'OTHER', name: 'Mail Server', total: formattedServiceDetails.mailServer?.giaTriHopDong || 0 });
            }
            if (formattedServiceDetails.ads?.giaTriHopDong || formattedServiceDetails.adsInfo) {
                services.push({ type: 'ADS_GG', name: 'Quảng cáo Ads', total: formattedServiceDetails.ads?.giaTriHopDong || 0, adsInfo: formattedServiceDetails.adsInfo || null });
            }
            if (formattedServiceDetails.facebook?.giaTriHopDong || formattedServiceDetails.facebookInfo) {
                services.push({ type: 'ADS_FB', name: 'Quảng cáo Facebook', total: formattedServiceDetails.facebook?.giaTriHopDong || 0, facebookInfo: formattedServiceDetails.facebookInfo || null });
            }

            const paymentStages = [];
            let paymentOrder = 1;
            
            const dot1Amount = (formattedServiceDetails.webChiTiet?.dot1 || 0) + (formattedServiceDetails.webUpgrade?.dot1 || 0) + (formattedServiceDetails.ads?.dot1 || 0) + (formattedServiceDetails.facebook?.dot1 || 0);
            if (dot1Amount > 0) paymentStages.push({ name: 'Lần 1', amount: dot1Amount, order: paymentOrder++, paidDate: null });

            const dot2Amount = (formattedServiceDetails.webChiTiet?.dot2 || 0) + (formattedServiceDetails.webUpgrade?.treo50Percent || 0) + (formattedServiceDetails.ads?.dot2 || 0) + (formattedServiceDetails.facebook?.dot2 || 0);
            if (dot2Amount > 0) paymentStages.push({ name: 'Lần 2', amount: dot2Amount, order: paymentOrder++, paidDate: null });

            const banGiaoAmount = (formattedServiceDetails.webChiTiet?.banGiao || 0) + (formattedServiceDetails.webUpgrade?.banGiao || 0);
            if (banGiaoAmount > 0) paymentStages.push({ name: 'Bàn giao', amount: banGiaoAmount, order: paymentOrder++, paidDate: null });

            const contractEmployees = values.employeeId ? [{ employeeId: values.employeeId, isMain: true }] : [];

            // Only send fields that exist in the Contracts Prisma schema
            const contractData: Record<string, any> = {
                contractCode: values.contractCode,
                title: values.title,
                type: values.type,
                status: values.status,
                receiptCode: values.receiptCode,
                signDate: values.signDate ? values.signDate.toISOString() : null,
                submissionDate: values.submissionDate ? values.submissionDate.toISOString() : null,
                totalAmount: values.totalAmount,
                vatAmount: values.vatAmount,
                vatRate: values.vatRate,
                paidAmount: values.paidAmount,
                remainingAmount: values.remainingAmount,
                serviceDetails: formattedServiceDetails,
                services: services,
                paymentStages: paymentStages,
                customerId: values.customerId,
                regionCode: values.regionCode,
                managerId: values.managerId,
                deptManagerId: values.deptManagerId,
                seniorDeptManagerId: values.seniorDeptManagerId,
                contractEmployees: contractEmployees,
            };
`;

content = content.replace(/            \/\/ Serialize dayjs dates inside serviceDetails[\s\S]*?employees: values\.employeeId \? \[\{ employeeId: values\.employeeId, isMain: true \}\] : \[\],\n            \};/, replacement.trim());

fs.writeFileSync(path, content, 'utf8');
console.log('Script updated create page payload.');
