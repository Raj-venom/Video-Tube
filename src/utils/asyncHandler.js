
const asyncHandler = (requestHandler) => {

    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}





export { asyncHandler }










/*
 *********** Try catch method ********************

// steps  

 const asyncFun = () => { }

 const asyncFun = (fn) => { }
 const asyncFun = (fn) => { () => {} }
 const asyncFun = (fn) =>  () => {} 

 const asyncFun = (fn) =>  async() => {} 
 const asyncFun = (fn) => async () => {}  // Higher Order function


const asyncHandler = (fn) => async (req, res, next) => {

    try {
        await fn(req,res, next)
        
    } catch (error) {
        res.status(error.code || 500).json({
            sucess: false,
            message: error.message
        })
    }
}

*/