class ApiResponse {
    constructor(
        statusCode,
        data,
        message = "Success"
    ) {
        this.statusCode = statusCode < 400 // sucess Codes are less then 400 
        this.message = message
        this.data = data
    }
}


// export default ApiResponse
export { ApiResponse }