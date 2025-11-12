/**
 * Utility to handle API responses and errors
 */
export async function handleApiResponse<T>(
    response: { data?: T; error?: unknown },
    errorMessage: string
): Promise<T> {
    if (response.error) {
        const errorDetails = JSON.stringify(response.error, null, 2)
        throw new Error(`${errorMessage}:\n${errorDetails}`)
    }
    return response.data!
}
