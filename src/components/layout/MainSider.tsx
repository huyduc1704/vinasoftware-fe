'use client';

import React from 'react';
import { Layout, Menu, theme, ConfigProvider } from 'antd';
import { DashboardOutlined, ControlOutlined, SettingOutlined, FileImageOutlined, EditOutlined, UserOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';

const { Sider } = Layout;

const items: MenuProps['items'] = [
    {
        key: 'dashboard',
        icon: <ControlOutlined />,
        label: 'Bảng điều khiển',
    },
    {
        key: 'accounting',
        icon: <DashboardOutlined />,
        label: 'Quản lý kế toán',
        children: [
            { key: 'area_list', label: 'Danh sách khu vực' },
            { key: 'area_manager', label: 'Trưởng khu vực' },
            { key: 'senior_manager', label: 'Trưởng phòng cấp cao' },
            { key: 'department_manager', label: 'Trưởng phòng' },
            { key: 'management', label: 'Quản lý' },
            { key: 'employee', label: 'Nhân viên' },
            { key: 'accountant', label: 'Kế toán' },
            { key: 'import_employee', label: 'Import nhân viên' },
            { key: 'import_contracts', label: 'Import kế toán' },
            { key: 'export_contracts_renewals', label: 'Export HĐ gia hạn' },
            { key: 'export_customer_care', label: 'Export HĐ CSKH' }
        ],
    },
    {
        key: 'customers',
        icon: <CustomerServiceOutlined />,
        label: 'Quản lý CSKH',
        children: [
            { key: 'customer_list', label: 'Khách hàng' }
        ]
    },
    {
        key: 'static_page_manager',
        icon: <EditOutlined />,
        label: 'Quản lý trang tĩnh',
        children: [
            { key: 'footer', label: 'Footer' }
        ]
    },
    {
        key: 'image_video_manager',
        icon: <FileImageOutlined />,
        label: 'Quản lý hình ảnh - video',
        children: [
            { key: 'logo', label: 'Logo' },
            { key: 'favicon', label: 'Favicon' }
        ]
    },
    {
        key: 'user_manager',
        icon: <UserOutlined />,
        label: 'Quản lý user',
        children: [
            { key: 'permission_group', label: 'Nhóm quyền' },
            { key: 'admin_info', label: 'Thông tin admin' },
            { key: 'admin_account', label: 'Tài khoản admin' },
            { key: 'customer_account', label: 'Tài khoản khách' },
        ]
    },
    {
        key: 'setting',
        icon: <SettingOutlined />,
        label: 'Thiết lập thông tin',
    },
];

export default function MainSider() {
    const router = useRouter();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const onMenuClick: MenuProps['onClick'] = (e) => {
        const navigateToEmployee = (roleCode: string | null) => {
            if (roleCode) {
                sessionStorage.setItem('employeeRoleCode', roleCode);
            } else {
                sessionStorage.removeItem('employeeRoleCode');
            }
            window.dispatchEvent(new Event('employeeRoleChanged'));
            router.push('/accounting/employee');
        };

        if (e.key === 'dashboard') {
            router.push('/');
        } else if (e.key === 'area_list') {
            router.push('/accounting/region');
        } else if (e.key === 'area_manager') {
            navigateToEmployee('TRUONG_KHU_VUC');
        } else if (e.key === 'senior_manager') {
            navigateToEmployee('TRUONG_PHONG_CAP_CAO');
        } else if (e.key === 'department_manager') {
            navigateToEmployee('TRUONG_PHONG');
        } else if (e.key === 'management') {
            navigateToEmployee('QUAN_LY');
        } else if (e.key === 'employee') {
            navigateToEmployee(null);
        } else if (e.key === 'customer_list') {
            router.push('/customers');
        } else if (e.key === 'accountant') {
            router.push('/accounting/contracts');
        }

    };

    return (
        <Sider
            width={260}
            style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}
            theme="light"
        >
            <div
                style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ color: '#d32f2f', margin: 0, fontSize: '26px', fontWeight: 900, lineHeight: 1, letterSpacing: '1px' }}>
                        VNS <span style={{ fontSize: '11px', fontWeight: 600, display: 'inline-block', verticalAlign: 'middle', textAlign: 'left', lineHeight: '1.2' }}>VINA<br />SOFTWARE</span>
                    </h1>
                </div>
            </div>
            <ConfigProvider
                theme={{
                    components: {
                        Menu: {
                            itemSelectedBg: '#f4d03f',
                            itemSelectedColor: '#000000',
                            itemHoverBg: '#fcf3cf',
                            itemHoverColor: '#000000',
                            itemMarginInline: 12,
                            itemBorderRadius: 8,
                            itemHeight: 48,
                        },
                    },
                }}
            >
                <Menu
                    mode="inline"
                    defaultSelectedKeys={['dashboard']}
                    style={{ height: 'calc(100% - 64px)', borderRight: 0, paddingTop: '16px' }}
                    items={items}
                    onClick={onMenuClick}
                />
            </ConfigProvider>
        </Sider>
    );
}
