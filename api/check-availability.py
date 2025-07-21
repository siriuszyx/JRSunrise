from http.server import BaseHTTPRequestHandler
import json
import requests
from bs4 import BeautifulSoup

trains = {"Takam":["%EF%BD%BB%EF%BD%BE%EF%BE%84%20%20000", "%EF%BD%BB%EF%BD%BE%EF%BE%84%EF%BD%BB%20000"], 
          "Izumo": ["%EF%BD%BB%EF%BD%B2%EF%BD%BD%EF%BE%93%20000", "%EF%BD%BB%EF%BD%B2%EF%BD%BD%EF%BE%93%EF%BD%BB000"],
         "Every": ["%EF%BD%BB%EF%BD%BE%EF%BE%84%20%20000", "%EF%BD%BB%EF%BD%BE%EF%BE%84%EF%BD%BB%20000", "%EF%BD%BB%EF%BD%B2%EF%BD%BD%EF%BE%93%20000", "%EF%BD%BB%EF%BD%B2%EF%BD%BD%EF%BE%93%EF%BD%BB000"]}

seats = {'3010000': "Ordinary",
'4110042': "Sleeper B Non Smoking",
'4120042': "Sleeper B Smoking",
'2110002': "Sleeper A Non Smoking",
'2120002': "Sleeper A Smoking",
'4110062': "Sleeper B Twin Non Smoking",
'4120062': "Sleeper B Twin Smoking"}

def checkAvailability(data):
    departStName = str(data.get('departStName'))
    arriveStName = str(data.get('arriveStName'))
    startDate = int(data.get('startDate'))
    endDate = int(data.get('endDate'))

    dates = []
    if str(startDate)[5] == str(endDate)[5]:
        dates = [str(d) for d in range(startDate, endDate+1)]
    else:
        startMonth = int(str(startDate)[4:6])
        startYear = int(str(startDate)[:4])
        endMonth = int(str(endDate)[4:6])
        endYear = int(str(endDate)[:4])
        day = 28
        if startMonth in (1, 3, 5, 7, 10, 12):
            day = 31
        elif startMonth != 2:
            day = 30
        elif startYear % 4 == 0:
            day = 29
            
        datesStart = [str(d) for d in range(startDate, int(str(startDate)[:6]+str(day))+1)]
        datesEnd = [str(d) for d in range(int(str(endDate)[:6]+"01"), endDate+1)]
        dates = datesStart + datesEnd
        
        
    url_template = "https://e5489.jr-odekake.net/e5489/ibpc/CBDayTimeArriveSelRsvMyDiaPC?inputType=0&inputHour=12&inputMinute=00&inputUniqueDepartSt=1&inputUniqueArriveSt=1&inputSearchType=2&inputSpecificTrainType1=2&inputReturnUrl=travel-information/en/tickets-passes/route-search/&SequenceType=1&LANG=en"
    urls = {}
    for date in dates:
        urls[date] = []
        applicable_trains = trains.get(departStName[:5], trains.get(arriveStName[:5], trains.get('Every')))
        for train in applicable_trains:
            urls[date].append(url_template + f"&inputDepartStName={departStName}&inputArriveStName={arriveStName}&inputTransferDepartStName1={departStName}&inputTransferArriveStName1={arriveStName}&inputTransferDepartStUnique1=1&inputTransferArriveStUnique1=1&inputTransferTrainType1=0001"+ f"&inputDate={date}&inputSpecificBriefTrainKana1={train}")
    
    trainNames = []
    results = {}
    for key, value in urls.items():
        print(f"Date: {key}")
        results[key] = []
        for i, url in enumerate(value):
            try:
                res = requests.get(url, timeout=30)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    train_names = soup.select("div.route-train-list__train-name.express")
                    if all("TWIN" in train_name.get_text(strip=True) for train_name in train_names) or all(train_name.get_text(strip=True) in trainNames for train_name in train_names):
                        pass
                    else:
                        trainNames.extend([train_name.get_text(strip=True) for train_name in train_names])
                    # 2. Find all tables and process <td>
                    tables = soup.find_all("table", class_="seat-facility js-filfac-target")
                    for train_name, table in zip(train_names, tables):
                        print("Train Name:", train_name.get_text(strip=True) if train_name else "Not found")
                        for td in table.find_all("td"):
                            data_id = td.get("data-search-id", "No data-search-id")
                            has_label = td.find("label") is not None
                            if has_label and data_id in seats:
                                print(f"Seat: {seats[data_id]} Available")
                                results[key].append({"trainName": train_name.get_text(strip=True),
                                                "availableSeatType": seats[data_id],
                                                "link": url})
                                print(url)
                            elif data_id in seats:
                                print(f"Seat: {seats[data_id]} Not Available")
                else:
                    print("Search Unavailable")
            except Exception as e:
                print(f"Error processing URL: {url}, Error: {str(e)}")
                
    print(results)
    return results

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            # Get the content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the POST data
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            
            # Call your existing function
            result = checkAvailability(data)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Write response
            response = json.dumps(result)
            self.wfile.write(response.encode('utf-8'))
            
        except Exception as e:
            # Error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode('utf-8'))
