'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Modal, message, Tag, App } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { roleApi } from '@/utils/api';
import { Role } from '@/types/role';
import RoleModal from '@/components/admin/RoleModal';
import RolePermissionAssignment from '@/components/admin/RolePermissionAssignment';

const { Title } = Typography;
const RolesPage = () => {
    const { message: messageApi, modal: modalApi } = App.useApp();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
    const fetchRoles = async () => {
        setLoading(true);
        try {
            const dbRoles = await roleApi.getRoles();
            setRoles(dbRoles);
        } catch (error: any) {
            messageApi.error('Không thể tải danh sách nhóm quyền: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setModalOpen(true);
    };

    const handleDelete = (role: Role) => {
        modalApi.confirm({
            title: 'Xác nhân xóa',
            content: `Bạn có chắc chắn muốn xóa nhóm quyền "${role.name}" không?`,
            onOk: async () => {
                try {
                    await roleApi.deleteRole(role.id);
                    messageApi.success('Đã xóa nhóm quyền');
                    fetchRoles();
                } catch (error: any) {
                    messageApi.error('Không thể xóa nhóm quyền: ' + error.message);
                }
            },
        });
    };

    const handleSaveRole = async (values: any) => {
        setLoading(true);
        try {
            if (editingRole) {
                await roleApi.updateRole(editingRole.id, values);
            } else {
                await roleApi.createRole(values);
            }
            setModalOpen(false);
            fetchRoles();
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Mã', dataIndex: 'code', key: 'code', render: (code: string) => <Tag color="blue">{code}</Tag> },
        { title: 'Tên nhóm quyền', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text}</strong> },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Role) => (
                <Space size="middle">
                    <Button icon={<SafetyCertificateOutlined />} onClick={() => { setSelectedRoleForPerms(record); setPermissionModalOpen(true); }}>
                        Gán quyền
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Xóa</Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Title level={2}>Quản lý Nhóm quyền</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); setModalOpen(true); }}>
                        Thêm nhóm quyền
                    </Button>
                </div>
                <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} />
            </Card>
            <RoleModal open={modalOpen} role={editingRole} onCancel={() => setModalOpen(false)}
                onSuccess={() => { setModalOpen(false); fetchRoles(); }} loading={loading} onSave={handleSaveRole} />
            {selectedRoleForPerms && (
                <RolePermissionAssignment open={permissionModalOpen} role={selectedRoleForPerms}
                    onCancel={() => setPermissionModalOpen(false)} onSuccess={() => { setPermissionModalOpen(false); fetchRoles(); }} />
            )}
        </div>
    );
};

export default RolesPage;