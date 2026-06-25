const APIKEY="99499603db5d887f2ea050dc1c272430";


/* TIME OF DAY */

let hour=new Date().getHours()

if(hour>=6 && hour<11){

document.body.classList.add("morning")

}

else if(hour>=11 && hour<17){

document.body.classList.add("afternoon")

}

else if(hour>=17 && hour<20){

document.body.classList.add("sunset")

}

else{

document.body.classList.add("night")

}
let currentTempC=0
let isCelsius=true
let currentWeatherData=null

const searchBtn=document.getElementById("searchBtn")
const cityInput=document.getElementById("cityInput")
const temp=document.getElementById("temp")
const humidity=document.getElementById("humidity")
const wind=document.getElementById("wind")
const cityName=document.getElementById("cityName")
const errorBox=document.getElementById("errorBox")
const forecast=document.getElementById("forecast")
const locationBtn=document.getElementById("locationBtn")
const unitToggle=document.getElementById("unitToggle")
const icon=document.getElementById("weatherIcon")
const dropdown=document.getElementById("recentCities")
const aqi=document.getElementById("aqi")
const rain=document.getElementById("rain")
const loader=document.getElementById("loader")

const sunrise=document.getElementById("sunrise")
const sunset=document.getElementById("sunset")
const pressure=document.getElementById("pressure")
const visibility=document.getElementById("visibility")

const aiBox=document.getElementById("aiBox")
const aiText=document.getElementById("aiText")
const timezoneInfo=document.getElementById("timezoneInfo")
const copyCityBtn=document.getElementById("copyCity")
const alertsBox=document.getElementById("alerts")

function getCachedData(key, ttl=30*60*1000){
  try{
    const item=JSON.parse(localStorage.getItem(key))
    if(!item) return null
    if(Date.now()-item.ts > ttl) {
      localStorage.removeItem(key)
      return null
    }
    return item.data
  }catch(e){
    console.error('cache get',e)
    return null
  }
}

function setCachedData(key,data){
  if(!window.localStorage) return
  try{
    localStorage.setItem(key, JSON.stringify({ts:Date.now(), data}))
  }catch(e){
    console.error('cache set',e)
  }
}

/* SEARCH */

searchBtn.onclick=()=>{

let city=cityInput.value.trim()

if(city===""){
showError("Enter city")
return
}

getWeather(city)

}

cityInput.addEventListener("keydown", e=>{
  if(e.key==="Enter"){
    searchBtn.click()
  }
})

function showError(message){
  errorBox.textContent=message
  errorBox.classList.remove("hidden")
  setTimeout(()=>errorBox.classList.add("hidden"), 4000)
}

/* GEO */

locationBtn.onclick=()=>{

navigator.geolocation.getCurrentPosition(pos=>{

getWeatherCoords(
pos.coords.latitude,
pos.coords.longitude
)

})

}

/* UNIT */

unitToggle.onclick=()=>{

if(currentWeatherData===null){
  return
}

if(isCelsius){
  temp.textContent=(currentTempC*9/5+32).toFixed(1)
  isCelsius=false
  unitToggle.textContent="Switch °C"
}else{
  temp.textContent=currentTempC.toFixed(1)
  isCelsius=true
  unitToggle.textContent="Switch °F"
}

updateTemperatureColor()

}

function updateTemperatureColor(){
  temp.classList.remove("hot","warm","cool","cold")
  const c=currentTempC
  if(c>=30) temp.classList.add("hot")
  else if(c>=20) temp.classList.add("warm")
  else if(c>=10) temp.classList.add("cool")
  else temp.classList.add("cold")
}

/* WEATHER */

async function getWeather(city){

loader.classList.remove("hidden")
errorBox.classList.add("hidden")

const cacheKey = `weather_${city.trim().toLowerCase()}`
let data = getCachedData(cacheKey)
let fromCache = !!data

try{
  if(!data){
    const res=await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKEY}&units=metric`
    )
    data=await res.json()
    if(data.cod!=200){
      showError("City not found")
      loader.classList.add("hidden")
      return
    }
    setCachedData(cacheKey,data)
  }

  currentWeatherData=data
  updateUI(data)
  getForecast(city)
  getAQI(data.coord.lat, data.coord.lon)
  getAlerts(data.coord.lat, data.coord.lon)
  generateAI(data)
  saveCity(city)

  if(fromCache){
    const fallbackHint = document.createElement('div')
    fallbackHint.className='error'
    fallbackHint.textContent='Showing stored data (offline mode); refresh to update.'
    setTimeout(()=>{ if(fallbackHint.parentNode) fallbackHint.remove() }, 5000)
    if(!errorBox.parentNode) document.querySelector('.search-card').appendChild(fallbackHint)
  }

}catch(error){
  const offlineData = getCachedData(cacheKey, 24*60*60*1000)
  if(offlineData){
    currentWeatherData=offlineData
    updateUI(offlineData)
    getForecast(offlineData.name)
    getAQI(offlineData.coord.lat, offlineData.coord.lon)
    getAlerts(offlineData.coord.lat, offlineData.coord.lon)
    generateAI(offlineData)
    showError('Offline mode: showing cached data')
  } else {
    showError("API error")
  }
  console.error(error)
} finally {
  loader.classList.add("hidden")
}

}

/* GEO WEATHER */

async function getWeatherCoords(lat,lon){

loader.classList.remove("hidden")
errorBox.classList.add("hidden")

const cacheKey = `weather_${lat}_${lon}`
let data = getCachedData(cacheKey)
let fromCache = !!data

try{
  if(!data){
    let res=await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric`
    )
    data=await res.json()
    if(data.cod!=200){
      showError("Location weather not found")
      loader.classList.add("hidden")
      return
    }
    setCachedData(cacheKey,data)
  }

  currentWeatherData=data
  updateUI(data)
  getForecast(data.name)
  getAQI(lat, lon)
  getAlerts(lat, lon)
  generateAI(data)
  saveCity(data.name)

  if(fromCache){
    showError('Offline mode: showing cached data')
  }

} catch(error){
  const offlineData = getCachedData(cacheKey, 24*60*60*1000)
  if(offlineData){
    currentWeatherData=offlineData
    updateUI(offlineData)
    getForecast(offlineData.name)
    getAQI(offlineData.coord.lat, offlineData.coord.lon)
    getAlerts(offlineData.coord.lat, offlineData.coord.lon)
    generateAI(offlineData)
    showError('Offline mode: showing cached data')
  } else {
    showError("API error")
  }
  console.error(error)
} finally {
  loader.classList.add("hidden")
}

}

/* UI */

function updateUI(data){

cityName.textContent=data.name

currentTempC=data.main.temp

isCelsius=true
unitToggle.textContent="Switch °F"

temp.textContent=currentTempC.toFixed(1)

updateTemperatureColor()

humidity.textContent=data.main.humidity+" %"

wind.textContent=data.wind.speed+" m/s"

pressure.textContent=data.main.pressure+" hPa"

visibility.textContent=
(data.visibility/1000)+" km"

sunrise.textContent=
new Date(data.sys.sunrise*1000)
.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})

sunset.textContent=
new Date(data.sys.sunset*1000)
.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})

let condition=data.weather[0].main

setWeatherIcon(condition)

setBackground(condition)

weatherEffects(condition)

checkExtremeConditions(data.main.temp, condition)

if(timezoneInfo){
  const offset=data.timezone
  const hours=offset/3600
  const sign=hours>=0?'+':'-'
  const tz= `UTC${sign}${Math.abs(hours)}`
  const localDate=new Date((data.dt + offset)*1000)
  timezoneInfo.textContent = `Local time: ${localDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} | Timezone: ${tz}`
}

if(cityName){
  cityName.textContent=data.name
}

}

function checkExtremeConditions(temp, condition){
  if(!alertsBox) return

  let messages=[]
  if(temp>=40){
    messages.push('Heat alert: temperature is 40°C or higher. Stay hydrated and avoid sun exposure.')
  }
  const dangerConditions=['Thunderstorm','Tornado','Ash','Smoke','Dust','Sand','Haze','Squall']
  if(dangerConditions.includes(condition)){
    messages.push(`Condition alert: ${condition} detected. Follow local safety guidance.`)
  }

  if(messages.length>0){
    alertsBox.innerHTML = messages.map(m=>`<b>⚠️</b> ${m}`).join('<br>')
    alertsBox.classList.remove('hidden')
  } else if(alertsBox.textContent==='No active alerts.' || alertsBox.classList.contains('hidden')){
    // keep the no alerts or existing API alerts
    if(alertsBox.textContent.includes('No active alerts.')||alertsBox.classList.contains('hidden')){
      alertsBox.classList.remove('hidden')
      alertsBox.textContent='No active alerts.'
    }
  }
}


/* AI TEXT */

function generateAI(data){

let t=data.main.temp
let h=data.main.humidity
let w=data.wind.speed
let cond=data.weather[0].main

let text=""

if(t>35)
  text+="Hot day. Stay hydrated. "
else if(t<10)
  text+="Cold conditions. Wear layers. "
else
  text+="Comfortable weather. "

if(h>80)
  text+="High humidity. "

if(w>10)
  text+="Windy conditions. "

if(cond==="Rain"||cond==="Drizzle")
  text+="Carry umbrella. "

if(cond==="Clear")
  text+="Good outdoor weather."

if(aiText){
  aiText.textContent = text || "Nice weather today!"
}

}

/* BACKGROUND */

function setBackground(condition){

document.body.classList.remove(
"sunny",
"cloudy",
"rainy",
"snow",
"default"
)

if(condition==="Clear")
document.body.classList.add("sunny")

else if(condition==="Clouds")
document.body.classList.add("cloudy")

else if(condition==="Rain"||condition==="Drizzle")
document.body.classList.add("rainy")

else if(condition==="Snow")
document.body.classList.add("snow")

else
document.body.classList.add("default")

}

/* ICON */

function getLocalWeatherIcon(condition){

const icons={

Clear:"icons8-sun-50.png",
Clouds:"icons8-spring-50.png",
Rain:"icons8-rain-50.png",
Thunderstorm:"icons8-lightning-bolt-50.png",
Snow:"icons8-snow-50.png",
Mist:"icons8-fog-50.png",
Haze:"icons8-haze-50.png"

}

return "assets/icons/"+(icons[condition]||"icons8-summer-50.png")

}

function setWeatherIcon(condition){
icon.src=getLocalWeatherIcon(condition)

}

/* EFFECT */

function weatherEffects(cond){

rain.classList.add("hidden")

if(cond==="Rain"||cond==="Thunderstorm")
rain.classList.remove("hidden")

}

async function getAQI(lat,lon){
  try{
    const res=await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${APIKEY}`
    )
    const data=await res.json()
    if(data.list && data.list.length>0){
      const index=data.list[0].main.aqi
      const labels=['Good','Fair','Moderate','Poor','Very Poor']
      aqi.textContent=`${index} (${labels[index-1]||'Unknown'})`
    } else {
      aqi.textContent='N/A'
    }
  }catch(err){
    console.error('AQI', err)
    aqi.textContent='N/A'
  }
}

async function getAlerts(lat, lon){
  if(!alertsBox) return
  try{
    const res=await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${APIKEY}`
    )
    const data=await res.json()
    if(data.alerts && data.alerts.length>0){
      const lines=data.alerts.map(a=>`<b>${a.event}</b>: ${a.description}`)
      alertsBox.innerHTML = lines.join('<br>')
      alertsBox.classList.remove('hidden')
    } else {
      alertsBox.textContent='No active alerts.'
      alertsBox.classList.remove('hidden')
    }
  }catch(err){
    console.error('Alerts', err)
    alertsBox.textContent='Weather alerts currently unavailable.'
    alertsBox.classList.remove('hidden')
  }
}

/* FORECAST */

async function getForecast(city){

forecast.innerHTML=""

let res=await fetch(
  `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${APIKEY}&units=metric`
)

let data=await res.json()

if(!data.list || data.list.length===0){
  forecast.innerHTML=`<div class="empty">No forecast data available.</div>`
  return
}

let days={}

data.list.forEach(item=>{
  const date=item.dt_txt.split(" ")[0]
  if(!days[date]) days[date]=[]
  days[date].push(item)
})

const dates=Object.keys(days)

if(dates.length===0){
  forecast.innerHTML=`<div class="empty">No forecast data available.</div>`
  return
}

const showDates=dates.slice(1,6) // next 5 days
let firstItem = null

showDates.forEach(date=>{
  const entries=days[date] || []
  const item=entries.find(i=>i.dt_txt.includes("12:00:00")) || entries[0]
  if(!item) return

  if(!firstItem) firstItem=item

  const card=document.createElement("div")
  card.className="forecast-card"
  const dateLabel=new Date(date+"T00:00:00").toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'})
  const condition=item.weather?.[0]?.main || ""
  const conditionIcon=getLocalWeatherIcon(condition)
  card.innerHTML=`
    <div class="forecast-top">
      <p class="forecast-date">${dateLabel}</p>
      <img class="forecast-icon" src="${conditionIcon}" alt="${condition}">
    </div>
    <div class="forecast-metrics">
      <div class="metric">
        <img class="metric-icon" src="assets/icons/icons8-summer-50.png" alt="">
        <span>${item.main.temp.toFixed(1)}°C</span>
      </div>
      <div class="metric">
        <img class="metric-icon" src="assets/icons/icons8-wind-50.png" alt="">
        <span>${item.wind.speed.toFixed(1)} m/s</span>
      </div>
      <div class="metric">
        <img class="metric-icon" src="assets/icons/icons8-wet-50.png" alt="">
        <span>${item.main.humidity}%</span>
      </div>
    </div>
  `

  card.onclick=()=>{
    document.querySelectorAll(".forecast-card").forEach(c=>c.classList.remove("activeDay"))
    card.classList.add("activeDay")
    showDayDetails(item)
  }

  forecast.appendChild(card)
})

if(firstItem){
  const firstCard = forecast.querySelector('.forecast-card')
  if(firstCard){
    firstCard.classList.add('activeDay')
    showDayDetails(firstItem)
  }
}

}

/* DAY DETAILS WITH SUN GRAPH */

function showDayDetails(item){

let panel=document.getElementById("dayDetails")

const sunriseText = currentWeatherData ? new Date(currentWeatherData.sys.sunrise*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '--'
const sunsetText = currentWeatherData ? new Date(currentWeatherData.sys.sunset*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '--'

panel.innerHTML=`
  <div class="sunPath">
    <div class="sunTimes">
      <span>🌅 Sunrise ${sunriseText}</span>
      <span>🌇 Sunset ${sunsetText}</span>
    </div>
    <div class="sunTrack">
      <div class="sunLine"></div>
      <div class="sun"></div>
    </div>
  </div>

  <div class="detailItem">
    <b>Date</b>
    <span>${item.dt_txt.split(' ')[0]}</span>
  </div>

  <div class="detailItem">
    <b>Temperature</b>
    <span>${item.main.temp.toFixed(1)}°C</span>
  </div>

  <div class="detailItem">
    <b>Feels Like</b>
    <span>${item.main.feels_like.toFixed(1)}°C</span>
  </div>

  <div class="detailItem">
    <b>Humidity</b>
    <span>${item.main.humidity}%</span>
  </div>

  <div class="detailItem">
    <b>Wind</b>
    <span>${item.wind.speed.toFixed(1)} m/s</span>
  </div>

  <div class="detailItem">
    <b>Pressure</b>
    <span>${item.main.pressure} hPa</span>
  </div>

  <div class="detailItem">
    <b>Condition</b>
    <span>${item.weather[0].description}</span>
  </div>
`

animateSun()

}

/* SUN MOVE */

function animateSun(){

let sun=document.querySelector(".sun")

if(!sun || !currentWeatherData) return

const sunriseTs=currentWeatherData.sys.sunrise
const sunsetTs=currentWeatherData.sys.sunset
const nowTs=currentWeatherData.dt
let ratio=(nowTs-sunriseTs)/(sunsetTs-sunriseTs)
if(isNaN(ratio) || ratio<0) ratio=0
if(ratio>1) ratio=1
const left=5 + ratio*90
sun.style.left=`${left.toFixed(1)}%`

sun.style.opacity = (ratio>=0 && ratio<=1) ? '1' : '0.35'

}

/* STORAGE */

function saveCity(city){

let cities=
JSON.parse(localStorage.getItem("cities"))||[]

const normalized=city.trim().toLowerCase()

if(!cities.some(c=>c.trim().toLowerCase()===normalized)){
  cities.push(city)
  localStorage.setItem(
    "cities",
    JSON.stringify(cities)
  )
}

loadCities()

}

function loadCities(){

let cities=
JSON.parse(localStorage.getItem("cities"))||[]

if(cities.length===0)
return

dropdown.classList.remove("hidden")

dropdown.innerHTML=""

cities.forEach(city=>{

let option=document.createElement("option")

option.value=city

option.textContent=city

dropdown.appendChild(option)

})

}

dropdown.onchange=()=>{
  getWeather(dropdown.value)
}

if(copyCityBtn){
  copyCityBtn.onclick=async ()=>{
    const city=cityName.textContent.trim()
    if(!city||city==='Search a city') return
    try{
      await navigator.clipboard.writeText(city)
      showError('City copied to clipboard')
    }catch(err){
      showError('Clipboard copy failed')
      console.error(err)
    }
  }
}

loadCities()

