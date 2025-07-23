from http.server import BaseHTTPRequestHandler
import json
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from collections import defaultdict

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

# Browser-like headers without cookies
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
}

# Thread-safe results storage
results_lock = threading.Lock()

def process_single_url(date, url, train_names_shared):
    """Process a single URL and return results"""
    local_results = []
    local_train_names = []
    
    try:
        # Create session without cookies
        session = requests.Session()
        session.cookies.clear()  # Disable cookies
        
        res = session.get(url, headers=HEADERS, timeout=30)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")

            # Check for error message first
            error_div = soup.find("div", class_="error-message")
            if error_div:
                error_message = error_div.get_text(strip=True)
                print(f"Error found for date {date}: {error_message}")
                return date, [{
                    "error": True,
                    "errorMessage": error_message,
                    "link": url
                }], local_train_names
                      
            train_names = soup.select("div.route-train-list__train-name.express")
            
            # Check if we should skip processing
            if all("TWIN" in train_name.get_text(strip=True) for train_name in train_names):
                return date, local_results, local_train_names
            
            # Thread-safe check for existing train names
            with results_lock:
                if all(train_name.get_text(strip=True) in train_names_shared for train_name in train_names):
                    return date, local_results, local_train_names
            
            local_train_names.extend([train_name.get_text(strip=True) for train_name in train_names])
            
            # Find all tables and process <td>
            tables = soup.find_all("table", class_="seat-facility js-filfac-target")
            for train_name, table in zip(train_names, tables):
                print(f"Processing Train: {train_name.get_text(strip=True)} for date {date}")
                for td in table.find_all("td"):
                    data_id = td.get("data-search-id", "No data-search-id")
                    has_label = td.find("label") is not None
                    if has_label and data_id in seats:
                        print(f"Date {date} - Seat: {seats[data_id]} Available")
                        local_results.append({
                            "trainName": train_name.get_text(strip=True),
                            "availableSeatType": seats[data_id],
                            "link": url
                        })
                    elif data_id in seats:
                        print(f"Date {date} - Seat: {seats[data_id]} Not Available")
        else:
            print(f"Search Unavailable for date {date}, status code: {res.status_code}")
            
    except Exception as e:
        print(f"Error processing URL for date {date}: {url}, Error: {str(e)}")
    
    return date, local_results, local_train_names

def checkAvailability(data):
    departStName = str(data.get('departStName'))
    arriveStName = str(data.get('arriveStName'))
    startDate = int(data.get('startDate'))
    endDate = int(data.get('endDate'))

    # Generate dates
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

    departHour = "18"
    # Generate departHour
    if departStName[:5] in ("Sanno", "Osaka", "Shizu"):
        departHour = "00"
    elif departStName[:5] in ("Okayam", "Himeji") and arriveStName[:8] in ("Takamats", "Izumoshi"):
        departHour = "05"
              
    # Build URLs for all dates and trains
    url_template = f"https://e5489.jr-odekake.net/e5489/ibpc/CBDayTimeArriveSelRsvMyDiaPC?inputType=0&inputHour={departHour}&inputMinute=00&inputUniqueDepartSt=1&inputUniqueArriveSt=1&inputSearchType=2&inputSpecificTrainType1=2&inputReturnUrl=travel-information/en/tickets-passes/route-search/&SequenceType=1&LANG=en"
    
    # Prepare all URL tasks
    url_tasks = []
    for date in dates:
        applicable_trains = trains.get(departStName[:5], trains.get(arriveStName[:5], trains.get('Every')))
        for train in applicable_trains:
            url = url_template + f"&inputDepartStName={departStName}&inputArriveStName={arriveStName}&inputTransferDepartStName1={departStName}&inputTransferArriveStName1={arriveStName}&inputTransferDepartStUnique1=1&inputTransferArriveStUnique1=1&inputTransferTrainType1=0001&inputDate={date}&inputSpecificBriefTrainKana1={train}"
            url_tasks.append((date, url))

    # Shared train names storage (thread-safe)
    train_names_shared = set()
    results = defaultdict(list)
    
    # Process URLs with multi-threading
    print(f"Processing {len(url_tasks)} URLs with multi-threading...")
    
    # Use ThreadPoolExecutor for concurrent processing
    max_workers = min(10, len(url_tasks))  # Limit concurrent requests
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_task = {
            executor.submit(process_single_url, date, url, train_names_shared): (date, url) 
            for date, url in url_tasks
        }
        
        # Process completed tasks
        for future in as_completed(future_to_task):
            date, url = future_to_task[future]
            try:
                task_date, local_results, local_train_names = future.result()
                
                # Thread-safe update of shared data
                with results_lock:
                    train_names_shared.update(local_train_names)
                    results[task_date].extend(local_results)
                    
            except Exception as e:
                print(f"Task failed for date {date}: {str(e)}")

    # Sort results by date
    sorted_results = {}
    for date in sorted(results.keys()):
        sorted_results[date] = results[date]
    
    print(f"Processing complete. Found results for {len(sorted_results)} dates.")
    print("Final results:", sorted_results)
    return sorted_results

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
