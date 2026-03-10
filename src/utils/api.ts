const API_BASE_URL = '/api';

/**
 * Helper function to handle fetch responses and include credentials (HttpOnly cookies)
 */
async function fetchWithCredentials(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        // This is crucial for sending/receiving HttpOnly cookies
        credentials: 'include',
    };

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Ignore JSON parse error if response is not JSON
        }
        throw new Error(errorMessage);
    }

    // Some endpoints like logout might return empty responses
    if (response.status === 204) {
        return null;
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
    getEmployees: async (params?: { roleCode?: string; seniorDeptManagerId?: string; deptManagerId?: string; managerId?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.roleCode) queryParams.append('roleCode', params.roleCode);
        if (params?.seniorDeptManagerId) queryParams.append('seniorDeptManagerId', params.seniorDeptManagerId);
        if (params?.deptManagerId) queryParams.append('deptManagerId', params.deptManagerId);
        if (params?.managerId) queryParams.append('managerId', params.managerId);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return fetchWithCredentials(`/employees${queryString}`, { method: 'GET' });
    },

    createEmployee: async (data: any) => {
        return fetchWithCredentials('/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getEmployeeById: async (id: string) => {
        return fetchWithCredentials(`/employee/${id}`, { method: 'GET' });
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

