export const initialState = {
    dots:[],
    graph: {},
    context: null,
    mode:null,
    clickedDot:null,
    startDot:null,
    finishDot:null
  }
  
export const reducer = (state,action) => {
    switch(action.type) {
        case "clear": 
            return {...initialState,context:state.context}
        case "changeMode":
            return {...state,mode:action.payload.mode === state.mode ? null : action.payload.mode}
        case "setContext":
            return {...state,context:action.payload.context}
        case "addDots":
            return {...state,dots:[...state.dots,action.payload.dot]}
        case "startDot":
            return {...state,startDot:action.payload.dot}
        case "finishDot":
            return {...state,finishDot:action.payload.dot}
        case "clickDot":
        if(action.payload.position === null) {
            const firstDotIndex = state.dots.findIndex(el => {
            if(el[0] === state.clickedDot[0] && el[1] === state.clickedDot[1]) {
                return true
            }
            return false
            })
            
            const secondDotIndex = state.dots.findIndex(el => {
            if(el[0] === action.payload.second[0] && el[1] === action.payload.second[1]) {
                return true
            }
            return false
            })
            const x = state.clickedDot[0] - action.payload.second[0]
            const y = state.clickedDot[1] - action.payload.second[1]
            const distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2))

            const newGraph = {...state.graph}
            newGraph[firstDotIndex] = {...state.graph[firstDotIndex],[secondDotIndex]:distance}
            newGraph[secondDotIndex] = {...state.graph[secondDotIndex],[firstDotIndex]:distance}

            return {...state,clickedDot: action.payload.position,graph:newGraph}
        }
            return {...state,clickedDot: action.payload.position}
        case "dropCalculatedPath": 
            return {...state, startDot:null,finishDot:null}
        default :
            return state
    }
}
