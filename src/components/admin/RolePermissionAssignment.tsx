import React, { useState, useEffect, Key } from 'react';
import { Modal, message, Spin, Collapse, Switch, Table, Checkbox, Typography, Space, Tooltip, Tag, App } from 'antd';
import { roleApi, permissionApi } from '@/utils/api';
import { Permission, Role } from '@/types/role';

const { Panel } = Collapse;
const { Text } = Typography;

interface Props {
    open: boolean;
    role: Role;
    onCancel: () => void;
    onSuccess: () => void;
}

interface GroupedPermission {
    resource: string;
    view?: Permission;
    create?: Permission;
    edit?: Permission;
    delete?: Permission;
    others: Permission[];
}

interface ModuleGroup {
    module: string;
    wildcards: Permission[];
    resources: GroupedPermission[];
}



const RolePermissionAssignment: React.FC<Props> = ({ open, role, onCancel, onSuccess }) => {
    const { message: messageApi } = App.useApp();
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [targetKeys, setTargetKeys] = useState<Key[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            Promise.all([
                permissionApi.getPermissions(),
                roleApi.getRoles().then(list => list.find((r: any) => r.id === role.id))
            ]).then(([perms, updatedRole]) => {
                setAllPermissions(perms);
                setTargetKeys(updatedRole?.permissions?.map((p: any) => p.id) || []);
            }).finally(() => setLoading(false));
        }
    }, [open, role]);

    const transformPermissions = (rawList: Permission[]): ModuleGroup[] => {
        const grouped: { [key: string]: { moduleName: string, wildcards: Permission[], resources: { [key: string]: GroupedPermission } } } = {};

        rawList.forEach(item => {
            const modName = item.module || 'KHÁC';
            if (!grouped[modName]) {
                grouped[modName] = { moduleName: modName, wildcards: [], resources: {} };
            }

            // 1. Wildcard Handling
            if (item.code.includes('*')) {
                grouped[modName].wildcards.push(item);
                return;
            }

            // 2. Resource & Action Logic
            const action = item.action?.toLowerCase() || 'other';
            const resourceKey = item.resource || 'GENERAL';

            if (!grouped[modName].resources[resourceKey]) {
                grouped[modName].resources[resourceKey] = {
                    resource: item.resource_name || resourceKey,
                    others: []
                };
            }

            const group = grouped[modName].resources[resourceKey];
            if (action === 'view') group.view = item;
            else if (action === 'create') group.create = item;
            else if (action === 'edit') group.edit = item;
            else if (action === 'delete') group.delete = item;
            else group.others.push(item);
        });

        return Object.entries(grouped).map(([name, data]) => ({
            module: name,
            wildcards: data.wildcards,
            resources: Object.values(data.resources)
        }));
    };

    const handleSwitchChange = (permissionId: string, checked: boolean, group?: GroupedPermission, mod?: ModuleGroup) => {
        let newKeys = [...targetKeys.map(String)];

        if (checked) {
            if (!newKeys.includes(permissionId)) newKeys.push(permissionId);

            // Chaining logic
            if (group) {
                if (permissionId === group.delete?.id) {
                    if (group.edit && !newKeys.includes(group.edit.id)) newKeys.push(group.edit.id);
                    if (group.view && !newKeys.includes(group.view.id)) newKeys.push(group.view.id);
                } else if (permissionId === group.edit?.id || permissionId === group.create?.id) {
                    if (group.view && !newKeys.includes(group.view.id)) newKeys.push(group.view.id);
                }
            }
        } else {
            newKeys = newKeys.filter(k => k !== permissionId);
            if (group && permissionId === group.view?.id) {
                const toRemove = [group.create?.id, group.edit?.id, group.delete?.id].filter(Boolean) as string[];
                newKeys = newKeys.filter(k => !toRemove.includes(k));
            }
            // If any child is unchecked, remove wildcard
            if (mod?.wildcards.length) {
                mod.wildcards.forEach(w => {
                    newKeys = newKeys.filter(k => k !== w.id);
                });
            }
        }

        // 2-Way Sync: Check if all child permissions in module are checked -> turn on Wildcard
        if (mod) {
            const childIds: string[] = [];
            mod.resources.forEach(res => {
                [res.view, res.create, res.edit, res.delete, ...res.others].forEach(p => {
                    if (p) childIds.push(p.id);
                });
            });

            const allChildrenChecked = childIds.length > 0 && childIds.every(id => newKeys.includes(id));
            if (allChildrenChecked && mod.wildcards.length) {
                mod.wildcards.forEach(w => {
                    if (!newKeys.includes(w.id)) newKeys.push(w.id);
                });
            }
        }

        setTargetKeys(newKeys);
    };

    const handleWildcardToggle = (mod: ModuleGroup, checked: boolean) => {
        let newKeys = [...targetKeys.map(String)];
        const allIds: string[] = [];

        // Include Wildcards
        mod.wildcards.forEach(w => allIds.push(w.id));

        // Include Children
        mod.resources.forEach(res => {
            [res.view, res.create, res.edit, res.delete, ...res.others].forEach(p => {
                if (p) allIds.push(p.id);
            });
        });

        if (checked) {
            newKeys = Array.from(new Set([...newKeys, ...allIds]));
        } else {
            newKeys = newKeys.filter(k => !allIds.includes(k));
        }
        setTargetKeys(newKeys);
    };

    const isWildcardSelected = (mod: ModuleGroup) => {
        if (!mod.wildcards.length) return false;
        return mod.wildcards.every(w => targetKeys.includes(w.id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await roleApi.assignPermissionsToRole(role.id, targetKeys.map(String));
            messageApi.success('Gán quyền thành công');
            onSuccess();
        } catch (error: any) {
            messageApi.error('Gán quyền thất bại: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const groupedData = transformPermissions(allPermissions);

    const columns = (mod: ModuleGroup) => [
        {
            title: 'Tài nguyên',
            dataIndex: 'resource',
            key: 'resource',
            width: 220,
            render: (text: string) => <Text strong style={{ fontSize: '13px' }}>{text}</Text>
        },
        {
            title: 'Xem',
            key: 'view',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: GroupedPermission) => record.view && (
                <Checkbox
                    checked={targetKeys.includes(record.view.id)}
                    onChange={(e) => handleSwitchChange(record.view!.id, e.target.checked, record, mod)}
                    className="checkbox-view group-checkbox"
                />
            )
        },
        {
            title: 'Thêm',
            key: 'create',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: GroupedPermission) => record.create && (
                <Checkbox
                    checked={targetKeys.includes(record.create.id)}
                    onChange={(e) => handleSwitchChange(record.create!.id, e.target.checked, record, mod)}
                    className="checkbox-create group-checkbox"
                />
            )
        },
        {
            title: 'Sửa',
            key: 'edit',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: GroupedPermission) => record.edit && (
                <Checkbox
                    checked={targetKeys.includes(record.edit.id)}
                    onChange={(e) => handleSwitchChange(record.edit!.id, e.target.checked, record, mod)}
                    className="checkbox-edit group-checkbox"
                />
            )
        },
        {
            title: 'Xóa',
            key: 'delete',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: GroupedPermission) => record.delete && (
                <Checkbox
                    checked={targetKeys.includes(record.delete.id)}
                    onChange={(e) => handleSwitchChange(record.delete!.id, e.target.checked, record, mod)}
                    className="checkbox-delete group-checkbox"
                />
            )
        },
        {
            title: 'Khác',
            key: 'others',
            render: (_: any, record: GroupedPermission) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                    {record.others.map(p => (
                        <Tooltip key={p.id} title={p.name}>
                            <Checkbox
                                checked={targetKeys.includes(p.id)}
                                onChange={(e) => handleSwitchChange(p.id, e.target.checked, undefined, mod)}
                                style={{ margin: 0 }}
                            >
                                <Text style={{ fontSize: '12px' }}>{p.code.split('_').pop()}</Text>
                            </Checkbox>
                        </Tooltip>
                    ))}
                </div>
            )
        }
    ];

    return (
        <Modal
            title={
                <Space>
                    <span>Phân quyền Nhóm:</span>
                    <Text strong underline>{role.name}</Text>
                </Space>
            }
            open={open}
            onOk={handleSave}
            onCancel={onCancel}
            confirmLoading={saving}
            width={1000}
            centered
            styles={{ body: { padding: 0 } }}
        >
            <div data-lenis-prevent="true" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                .group-checkbox .ant-checkbox-inner { width: 18px; height: 18px; }
                .checkbox-view .ant-checkbox-checked .ant-checkbox-inner { background-color: #52c41a; border-color: #52c41a; }
                .checkbox-create .ant-checkbox-checked .ant-checkbox-inner { background-color: #fa8c16; border-color: #fa8c16; }
                .checkbox-edit .ant-checkbox-checked .ant-checkbox-inner { background-color: #1890ff; border-color: #1890ff; }
                .checkbox-delete .ant-checkbox-checked .ant-checkbox-inner { background-color: #ff4d4f; border-color: #ff4d4f; }
                .permission-modal-collapse .ant-collapse-header { background: #fafafa; border-bottom: 1px solid #f0f0f0 !important; }
                .permission-modal-collapse .ant-collapse-content-box { padding: 0 !important; }
                .module-header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-right: 8px; }
                .ant-table-small .ant-table-thead > tr > th { background: #fdfdfd; }
                .permission-modal-collapse { overflow: visible !important; }
            `}} />

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
                ) : (
                    <Collapse className="permission-modal-collapse" ghost defaultActiveKey={[groupedData[0]?.module]}>
                        {groupedData.map(mod => (
                            <Panel
                                header={
                                    <div className="module-header">
                                        <Text strong><Space>{mod.module} <Tag color="blue">{mod.resources.length} tài nguyên</Tag></Space></Text>
                                        <Space size="middle" onClick={e => e.stopPropagation()}>
                                            <Text type="secondary">Chọn tất cả</Text>
                                            <Switch
                                                size="small"
                                                checked={isWildcardSelected(mod)}
                                                onChange={(checked) => handleWildcardToggle(mod, checked)}
                                            />
                                        </Space>
                                    </div>
                                }
                                key={mod.module}
                            >
                                <Table
                                    dataSource={mod.resources}
                                    columns={columns(mod)}
                                    pagination={false}
                                    size="small"
                                    rowKey={(record) => record.view?.id || record.create?.id || record.edit?.id || record.resource}
                                    bordered
                                    scroll={{ x: 'max-content' }}
                                />
                            </Panel>
                        ))}
                    </Collapse>
                )}
            </div>
        </Modal>
    );
}


export default RolePermissionAssignment;
