import React, { useEffect, useReducer, useRef } from 'react'
import classes from './App.module.css';
import { shortPath } from './utils/shortPath';
import {reducer, initialState} from './store/reducer';



function App() {
  const [state,dispatch] = useReducer(reducer,initialState)
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const stateRef = useRef(null)

  stateRef.current = state 
  contextRef.current = state.context

  const RADIUS = 25

  function clickButtonHandler(number) {
    dispatch({type:"changeMode",payload: {mode:number}})
  }
  function getPosition(e) {
    const rect = e.target.getBoundingClientRect()
    const position = [e.clientX - rect.left,e.clientY - rect.top]
    return position
  }
  async function addDots(e) {
    const position = getPosition(e)

    const isBusy = isClickDot(position) ? true : false

    if(isBusy) {
      alert("Place is taken")
      return
    }
   
    //drawArc([position],"black")
    await dispatch({type:"addDots",payload:{dot:[...position]}})

    redrawCanvas()
   
  }

  function drawBorderDots(ignoreDot) {
    const ctx = contextRef.current
    const state = stateRef.current
    ctx.lineWidth = 5
    ctx.strokeStyle = "green"

    state.dots.forEach(el => {
      if(ignoreDot[0] === el[0] && ignoreDot[1] === el[1]) {
        return
      }
      ctx.beginPath()
      ctx.arc(el[0],el[1],RADIUS, 0, Math.PI * 2)
      ctx.stroke()
      ctx.closePath()
    })
    
  }

  function redrawCanvas() {
    const ctx = contextRef.current
    const state = stateRef.current

    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)

    drawArc(state.dots,"black")
    Object.keys(state.graph).forEach(el => {    
      Object.keys(state.graph[el]).forEach(wrapped => {
        ctx.beginPath()
        ctx.strokeStyle = "black"
        ctx.lineWidth = 5
        ctx.moveTo(state.dots[el][0],state.dots[el][1])
        ctx.lineTo(state.dots[wrapped][0],state.dots[wrapped][1])
        ctx.stroke()
        ctx.closePath()
      }) 
    })
  }

  async function connectDots(e) {
    const ctx = contextRef.current
    const position = getPosition(e)

    const positionDot = isClickDot(position)

    if(!positionDot) {
      alert("Click on the dots")
      return
    }

    if(!stateRef.current.clickedDot && positionDot) {
      dispatch({type:"clickDot",payload:{position:positionDot}})
      drawBorderDots(positionDot)
    } else if(positionDot) {
      ctx.beginPath()
      ctx.strokeStyle = "black"
      ctx.lineWidth = 5
      ctx.moveTo(stateRef.current.clickedDot[0],stateRef.current.clickedDot[1])
      ctx.lineTo(positionDot[0],positionDot[1])
      ctx.stroke()
      ctx.closePath()
      await dispatch({type:"clickDot",payload:{position:null,second:positionDot}})
      redrawCanvas()
    }
  }
  function chooseStartNFinish(e) {
    const ctx = contextRef.current
    const position = getPosition(e)

    let startDot = stateRef.current.startDot
    let finishDot = stateRef.current.finishDot

    if(startDot === null) {
      const index = findDotIndex(position)
      
      if(typeof(index) === "number") {
        dispatch({type:"startDot",payload:{dot:index}})
        drawBorderDots(stateRef.current.dots[index])
      }
      return
    }

    if(finishDot === null) {
      const index = findDotIndex(position)

      if(typeof(index) === "number") {
        dispatch({type:"finishDot",payload:{dot:index}})
      }
      finishDot = index
    }

    const [costs,path,isFound] = shortPath(stateRef.current.graph,startDot,finishDot)

    if(!isFound) {
      alert("Path not found")
      return
    }

    const convertedPath = convertPath(path,startDot,finishDot)
    redrawCanvas()
    //draw red lines instead of black lines 
    ctx.beginPath()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 5
    ctx.moveTo(stateRef.current.dots[convertedPath[0]][0],stateRef.current.dots[convertedPath[0]][1])
    for(let i = 1; i<convertedPath.length;i++) {
      ctx.lineTo(stateRef.current.dots[convertedPath[i]][0],stateRef.current.dots[convertedPath[i]][1])
      ctx.stroke()
    }
    ctx.closePath()

    //draw red circle instead of black circle 
    drawArc([[stateRef.current.dots[convertedPath[0]][0],stateRef.current.dots[convertedPath[0]][1]]],"red")

    for(let i = 1; i < convertedPath.length;i++) {
      drawArc([[stateRef.current.dots[convertedPath[i]][0],stateRef.current.dots[convertedPath[i]][1]]],"red")
    }

    dispatch({type:"startDot",payload:{dot:null}})
    dispatch({type:"finishDot",payload:{dot:null}})
  }
  
  function drawArc(positionArr,color) {
    const ctx = contextRef.current
    positionArr.forEach(el => {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(el[0],el[1],RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
    })
  }

  function findDotIndex(position) {
    const index = stateRef.current.dots.findIndex(el => {
      const x = position[0] - el[0]
      const y = position[1] - el[1]
      const distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2))
      
      if(distance <= RADIUS * 2) {
        return true
      }
      return false
    })
    return index
  }
  
  function isClickDot(position) {
    const tempArr = stateRef.current.dots.filter(el => {
      const x = Math.pow(position[0] - el[0],2)
      const y = Math.pow(position[1] - el[1],2)
      if(Math.sqrt(x+y) <= RADIUS) {
        return true
      }
      return false
    })

    return tempArr[0]
  }

  function clearCanvas() {
    const ctx = contextRef.current

    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)
    dispatch({type:'clear'})
  }

  function convertPath(path,start,finish) {
    let curEl = String(finish)
    const result = []
    
    while(String(curEl) !== String(start)) {
      result.unshift(Number(curEl))
      curEl = Number(path[curEl])
    }
    
    result.unshift(Number(start))
    return result
  }

  

  function clickCanvas(e) {
    const mode = stateRef.current.mode

    switch(mode) {
      case 1: 
        addDots(e)
        break
      case 2: 
        connectDots(e)
        break
      case 3:
        chooseStartNFinish(e)
        break
      default:
        break
    }
  }

  useEffect(() => {
    canvasRef.current.width = 1800
    canvasRef.current.height = 850
    canvasRef.current.style.width = 1800 + "px"
    canvasRef.current.style.height = 850 + "px"
    const ctx = canvasRef.current.getContext('2d')
    dispatch({type:"setContext",payload:{context:ctx}})
  },[])

  return (
    <div className={classes.app}>
      <header className = {classes.app__header}>
        <button onClick = {clearCanvas}>Clear</button>
        <button className = {`${state.mode === 1 && classes.app__button_active} `} onClick = {() => clickButtonHandler(1)}>Dots</button>
        <button className = {`${state.mode === 2 && classes.app__button_active} `} onClick = {() => {
          alert("Connect the dots")
          clickButtonHandler(2)
        }}>Connections</button>
        <button className = {`${state.mode === 3 && classes.app__button_active} `} onClick = {(e) => {
          alert("Choose start and finish")
          clickButtonHandler(3)
        }}>Calculate</button>
      </header>
      <main className = {classes.app__main}>
        <canvas ref = {canvasRef} onClick = { clickCanvas }></canvas>
      </main>
    </div>
  );
}

export default App;
