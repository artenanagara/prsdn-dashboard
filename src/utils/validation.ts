/**
 * Username validation utilities
 */

/**
 * Check if username meets the required format
 * Rules: lowercase letters and numbers only, no spaces or special characters
 */
export const isValidUsername = (username: string): boolean => {
    if (!username) return false;
    const usernameRegex = /^[a-z0-9]+$/;
    return usernameRegex.test(username);
};

/**
 * Validate username and return detailed error message if invalid
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
    if (!username || username.trim() === '') {
        return { valid: false, error: 'Username tidak boleh kosong' };
    }

    if (username.length < 3) {
        return { valid: false, error: 'Username minimal 3 karakter' };
    }

    if (username.length > 20) {
        return { valid: false, error: 'Username maksimal 20 karakter' };
    }

    if (!isValidUsername(username)) {
        return { valid: false, error: 'Username hanya boleh huruf kecil dan angka, tanpa spasi' };
    }

    return { valid: true };
};

/**
 * Normalize username to lowercase and remove spaces
 */
export const normalizeUsername = (username: string): string => {
    return username.toLowerCase().replace(/\s+/g, '');
};
