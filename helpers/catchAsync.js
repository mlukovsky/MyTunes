//Catches errors in async functions and passes them to next

module.exports = func => {
    //pass in func
    return (req, res, next) => {
        //returns a new function that has func executed, and then catches errors and passes them to next
        func(req, res, next).catch(next);
    }
}