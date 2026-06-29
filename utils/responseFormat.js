const formatRes = ({code, message, data = null, error = null})=>{
    const response = {
        apiResponseStatus: code,
        apiResponseMessage : message,
        apiResponseTimestamp : new Date().toISOString(),
        apiResponseData : data || []
    }

    if(error){
    response.apiResponseData.data = {error : error}
    }

    return response;
};

module.exports = formatRes;