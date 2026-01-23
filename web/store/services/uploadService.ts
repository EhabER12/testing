import axiosInstance from "@/lib/axios";

export interface UploadImageResponse {
    success: boolean;
    data: {
        url: string;
    };
    message: string;
}

/**
 * Upload an image to the server
 * @param file The image file to upload
 * @returns The uploaded image URL
 */
export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axiosInstance.post<UploadImageResponse>(
        "/uploads/image",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    if (response.data.success) {
        return response.data.data.url;
    } else {
        throw new Error(response.data.message || "Failed to upload image");
    }
};
