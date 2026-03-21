const API_BASE_URL = '/api';

let isRefreshing = false;
let refreshSubscribers: ((isSuccess: boolean) => void)[] = [];

function onRefreshed(isSuccess: boolean) {
    refreshSubscribers.forEach((callback) => callback(isSuccess));
    refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (isSuccess: boolean) => void) {
    refreshSubscribers.push(callback);
}

/**
 * Helper function to handle fetch responses and include credentials (HttpOnly cookies)
 */

async function fetchWithCredentials(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        ...options.headers as Record<string, string>,
    };

    //if body is not FormData, default content type is application/json
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const defaultOptions: RequestInit = {
        ...options,
        headers,
        // This is crucial for sending/receiving HttpOnly cookies
        credentials: 'include',
    };

    let response = await fetch(url, defaultOptions);

    if (response.status === 401 && endpoint !== '/auth/refresh-token' && endpoint !== '/auth/login') {
        if (!isRefreshing) {
            isRefreshing = true;

            try {
                // Gọi tới endpoint refresh-token
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                    method: 'POST',
                    credentials: 'include' // Bắt buộc gửi cookie lên
                });

                if (refreshResponse.ok) {
                    isRefreshing = false;
                    onRefreshed(true); // Nhắc các API đang bị treo hãy chạy lại

                    // Chạy lại ngay chính cái request ban đầu vừa fail
                    return fetchWithCredentials(endpoint, options);
                } else {
                    // Nếu refresh token cũng ngỏm -> Bắt người dùng đăng nhập lại
                    isRefreshing = false;
                    onRefreshed(false);

                    // Có thể thêm event chuyển hướng về Login tại đây
                    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                        window.location.href = '/login?session_expired=true';
                    }
                    throw new Error('Phiên đăng nhập đã hết hạn');
                }
            } catch (error) {
                isRefreshing = false;
                onRefreshed(false);
                throw error;
            }
        } else {
            return new Promise((resolve, reject) => {
                addRefreshSubscriber((isSuccess) => {
                    if (isSuccess) {
                        resolve(fetchWithCredentials(endpoint, options)); // Gọi lại request sau khi có token mới
                    } else {
                        reject(new Error('Chưa thể làm mới phiên đăng nhập'));
                    }
                });
            });
        }
    }

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Trường hợp response gửi về không phải là JSON (HTML tĩnh, proxy error...)
        }
        throw new Error(errorMessage);
    }


    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/octet-stream'))) {
        return response.blob();
    }

    return response.json();
}

export const authApi = {
    login: async (credentials: any) => {
        return fetchWithCredentials('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    getMe: async () => {
        return fetchWithCredentials('/auth/me', {
            method: 'GET',
        });
    },

    refreshToken: async () => {
        return fetchWithCredentials('/auth/refresh-token', {
            method: 'POST',
        });
    },

    changePassword: async (data: any) => {
        return fetchWithCredentials('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    logout: async () => {
        return fetchWithCredentials('/auth/logout', {
            method: 'POST',
        });
    },
};

export const employeeApi = {
    getEmployees: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        roleCode?: string;
        seniorDeptManagerId?: string;
        deptManagerId?: string;
        managerId?: string;
        areaManagerId?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.roleCode) queryParams.append('roleCode', params.roleCode);
        if (params?.seniorDeptManagerId) queryParams.append('seniorDeptManagerId', params.seniorDeptManagerId);
        if (params?.deptManagerId) queryParams.append('deptManagerId', params.deptManagerId);
        if (params?.managerId) queryParams.append('managerId', params.managerId);
        if (params?.areaManagerId) queryParams.append('areaManagerId', params.areaManagerId);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return fetchWithCredentials(`/employees${queryString}`, { method: 'GET' });
    },

    exportExcel: async (params?: {
        search?: string;
        roleCode?: string;
        seniorDeptManagerId?: string;
        deptManagerId?: string;
        managerId?: string;
        areaManagerId?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.roleCode) queryParams.append('roleCode', params.roleCode);
        if (params?.seniorDeptManagerId) queryParams.append('seniorDeptManagerId', params.seniorDeptManagerId);
        if (params?.deptManagerId) queryParams.append('deptManagerId', params.deptManagerId);
        if (params?.managerId) queryParams.append('managerId', params.managerId);
        if (params?.areaManagerId) queryParams.append('areaManagerId', params.areaManagerId);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return fetchWithCredentials(`/excel/export/employees${queryString}`, { method: 'GET' });
    },

    createEmployee: async (data: any) => {
        return fetchWithCredentials('/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getEmployeeById: async (id: string) => {
        return fetchWithCredentials(`/employees/${id}`, { method: 'GET' });
    },

    updateEmployee: async (id: string, data: any) => {
        return fetchWithCredentials(`/employees/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    deleteEmployee: async (id: string) => {
        return fetchWithCredentials(`/employees/${id}`, { method: 'DELETE' });
    },
    uploadImage: async (employeeId: string, category: 'AVATAR' | 'ID_FRONT' | 'ID_BACK', file: File | Blob | any) => {
        const formData = new FormData();
        // NÊN append các trường text (category, employeeId) VÀO TRƯỚC trường file
        // Để backend (đặc biệt là multer) có thể đọc được req.body trước khi parse luồng file
        formData.append('category', category);
        formData.append('employeeId', employeeId);

        // Truyền kèm tên file gốc để backend chắc chắn nhận diện được extension (.png, .jpg)
        formData.append('file', file, file.name || 'upload.png');

        return fetchWithCredentials('/cloudinary/image', {
            method: 'POST',
            body: formData,
        });
    },
};

export const usersApi = {
    getUsers: async () => {
        return fetchWithCredentials('/users', { method: 'GET' });
    },
    getUserById: async (id: string) => {
        return fetchWithCredentials(`/users/${id}`, { method: 'GET' });
    },
    createUser: async (data: any) => {
        return fetchWithCredentials('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateUser: async (id: string, data: any) => {
        return fetchWithCredentials(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
    deleteUser: async (id: string) => {
        return fetchWithCredentials(`/users/${id}`, { method: 'DELETE' });
    },

    getAdmins: async () => {
        return fetchWithCredentials('/users/admins', { method: 'GET' });
    },

    getGuests: async () => {
        return fetchWithCredentials('/users/guests', { method: 'GET' });
    }
};

export const regionApi = {
    getRegions: async () => {
        return fetchWithCredentials('/regions', { method: 'GET' });
    },
    getRegionById: async (id: string) => {
        return fetchWithCredentials(`/regions/${id}`, { method: 'GET' });
    },
    createRegion: async (data: any) => {
        return fetchWithCredentials('/regions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateRegion: async (id: string, data: any) => {
        return fetchWithCredentials(`/regions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
    deleteRegion: async (id: string) => {
        return fetchWithCredentials(`/regions/${id}`, { method: 'DELETE' });
    }
};

export const customerApi = {
    getCustomers: async () => {
        return fetchWithCredentials('/customers', { method: 'GET' });
    },
    getCustomerById: async (id: string) => {
        return fetchWithCredentials(`/customers/${id}`, { method: 'GET' });
    },
    createCustomer: async (data: any) => {
        return fetchWithCredentials('/customers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateCustomer: async (id: string, data: any) => {
        return fetchWithCredentials(`/customers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
    deleteCustomer: async (id: string) => {
        return fetchWithCredentials(`/customers/${id}`, { method: 'DELETE' });
    }
};

export const contractApi = {
    getContracts: async (params?: { type?: string; status?: string; employeeId?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.employeeId) queryParams.append('employeeId', params.employeeId);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return fetchWithCredentials(`/contracts${queryString}`, { method: 'GET' });
    },
    getContractById: async (id: string) => {
        return fetchWithCredentials(`/contracts/${id}`, { method: 'GET' });
    },
    createContract: async (data: any) => {
        return fetchWithCredentials('/contracts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    updateContract: async (id: string, data: any) => {
        return fetchWithCredentials(`/contracts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
    deleteContract: async (id: string) => {
        return fetchWithCredentials(`/contracts/${id}`, { method: 'DELETE' });
    },
    // Advanced contract features
    updateAssignees: async (id: string, data: { employees: { employeeId: string; isMain: boolean }[] }) => {
        return fetchWithCredentials(`/contracts/${id}/assignees`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    addRenewal: async (id: string, data: { renewalDate: string; note?: string }) => {
        return fetchWithCredentials(`/contracts/${id}/renewals`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    addNote: async (id: string, data: { content: string }) => {
        return fetchWithCredentials(`/contracts/${id}/notes`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    importContracts: async (formData: FormData) => {
        return fetchWithCredentials('/excel/import/contracs', {
            method: 'POST',
            body: formData,
        });
    }
};

export const roleApi = {
    // GET /api/roles -Lấy danh sách tất cả nhóm quyền
    getRoles: async () => {
        return fetchWithCredentials('/roles', { method: 'GET' });
    },

    //POST /api/roles - Tạo nhóm quyền mới
    createRole: async (data: { code: string; name: string; description?: string }) => {
        return fetchWithCredentials('/roles', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    //PATCH /api/roles/{id} - Cập nhật thông tin nhóm quyền 
    updateRole: async (id: string, data: { name?: string; description?: string }) => {
        return fetchWithCredentials(`/roles/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    //DELETE /api/roles/{id} - Xóa nhóm quyền
    deleteRole: async (id: string) => {
        return fetchWithCredentials(`/roles/${id}`, { method: 'DELETE' });
    },

    //POST /api/roles/{id}/permissions - Gán danh sách nhóm quyền
    assignPermissionsToRole: async (id: string, permissionIds: string[]) => {
        return fetchWithCredentials(`/roles/${id}/permissions`, {
            method: 'POST',
            body: JSON.stringify({ permissionIds }),
        });
    },

    //POST /api/roles/users/{userId}/assign - Gán nhóm quyền cho người dùng
    assignRoleToUser: async (userId: string, roleCode: string) => {
        return fetchWithCredentials(`/roles/users/${userId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ roleCode }),
        });
    },

    //DELETE /api/roles/users/{userId}/remove/{roleCode} - Xóa nhóm quyền khỏi người dùng
    removeRoleFromUser: async (userId: string, roleCode: string) => {
        return fetchWithCredentials(`/roles/users/${userId}/remove/${roleCode}`, {
            method: 'DELETE',
        });
    },
};

export const permissionApi = {
    //GET /api/permissions - Lấy danh sách tất cả quyền
    getPermissions: async () => {
        return fetchWithCredentials('/permissions', { method: 'GET' });
    },
}

export const systemSettingsApi = {
    getSettings: async () => {
        return fetchWithCredentials('/system-settings', { method: 'GET' });
    },

    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithCredentials('/system-settings/upload-logo', {
            method: 'POST',
            body: formData,
        });
    },

    uploadFavicon: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithCredentials('/system-settings/upload-favicon', {
            method: 'POST',
            body: formData,
        });
    },

    deleteLogo: async () => {
        return fetchWithCredentials('/system-settings/logo', { method: 'DELETE' });
    },

    deleteFavicon: async () => {
        return fetchWithCredentials('/system-settings/favicon', { method: 'DELETE' });
    },

    updateTextSettings: async (settings: { key: string; value: string; description?: string }[]) => {
        return fetchWithCredentials('/system-settings/text', {
            method: 'POST',
            body: JSON.stringify({ settings }),
        });
    },
}

export const cloudinaryApi = {
    deleteImage: async (publicId: string) => {
        return fetchWithCredentials('/cloudinary/image', {
            method: 'DELETE',
            body: JSON.stringify({ public_id: publicId }),
        });
    },
}

export const dashboardApi = {
    getStats: async () => {
        return fetchWithCredentials('/dashboard/stats', { method: 'GET' });
    },

    getFeaturedEmployees: async () => {
        return fetchWithCredentials('/dashboard/featured-employees', { method: 'GET' });
    },

    getRevenueChart: async () => {
        return fetchWithCredentials('/dashboard/revenue-chart', { method: 'GET' });
    },
};



