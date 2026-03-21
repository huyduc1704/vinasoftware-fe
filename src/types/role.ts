export interface Permission {
    id: string;
    code: string;
    name: string;
    module?: string;
    resource?: string;
    action?: string;
    resource_name?: string;
    description?: string;
}

export interface Role {
    id: string;
    code: string;
    name: string;
    description?: string;
    permission?: Permission[];
    createdAt?: string;
    updatedAt?: string;
}

