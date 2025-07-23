import React, { useState, useEffect } from 'react';
import { Calendar, Train, MapPin, Clock, ExternalLink } from 'lucide-react';

const App = () => {
  const [language, setLanguage] = useState('en');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [originStation, setOriginStation] = useState('');
  const [destinationStation, setDestinationStation] = useState('');
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [minStartDate, setMinStartDate] = useState('');
  const [maxStartDate, setMaxStartDate] = useState('');
  const [minEndDate, setMinEndDate] = useState('');
  const [maxEndDate, setMaxEndDate] = useState('');

  // Translations object
  const translations = {
    en: {
      title: "JR Sunrise Express Space Checking",
      travelDates: "Travel Dates",
      startDate: "Start Date",
      endDate: "End Date",
      route: "Route",
      originStation: "Origin Station",
      destinationStation: "Destination Station",
      selectOriginStation: "Select origin station...",
      selectDestinationStation: "Select destination station...",
      searchAvailableTrains: "Search Available Trains",
      searching: "Searching...",
      searchingMessage: "Searching for available trains...",
      searchingSubMessage: "This may take a few moments",
      searchResults: "Search Results",
      noTrainsAvailable: "No trains available on this date",
      bookNow: "Book Now",
      fillAllFields: "Please fill in all fields",
      errorOccurred: "Error occurred while searching. Please try again.",
      stations: {
        "Tokyo": "Tokyo",
        "Yokohama": "Yokohama",
        "Shizuoka": "Shizuoka",
        "Osaka": "Osaka",
        "Sannomiya": "Sannomiya",
        "Himeji": "Himeji",
        "Okayama": "Okayama",
        "Takamatsu": "Takamatsu",
        "Izumoshi": "Izumoshi"
      }
    },
    ja: {
      title: "JR サンライズエクスプレス 空席確認",
      travelDates: "乗車日",
      startDate: "出発日",
      endDate: "最終日",
      route: "経路",
      originStation: "出発駅",
      destinationStation: "到着駅",
      selectOriginStation: "出発駅を選択してください...",
      selectDestinationStation: "到着駅を選択してください...",
      searchAvailableTrains: "空席を検索",
      searching: "検索中...",
      searchingMessage: "利用可能な列車を検索しています...",
      searchingSubMessage: "少々お待ちください",
      searchResults: "検索結果",
      noTrainsAvailable: "この日は利用可能な列車がありません",
      bookNow: "予約する",
      fillAllFields: "すべての項目を入力してください",
      errorOccurred: "検索中にエラーが発生しました。もう一度お試しください。",
      stations: {
        "Tokyo": "東京",
        "Yokohama": "横浜",
        "Shizuoka": "静岡",
        "Osaka": "大阪",
        "Sannomiya": "三宮",
        "Himeji": "姫路",
        "Okayama": "岡山",
        "Takamatsu": "高松",
        "Izumoshi": "出雲市"
      }
    },
    'zh-cn': {
      title: "JR “SUNRISE濑户·出云” 号列车 座位查询",
      travelDates: "旅行日期",
      startDate: "开始日期",
      endDate: "结束日期",
      route: "路线",
      originStation: "出发站",
      destinationStation: "到达站",
      selectOriginStation: "请选择出发站...",
      selectDestinationStation: "请选择到达站...",
      searchAvailableTrains: "搜索可用列车",
      searching: "搜索中...",
      searchingMessage: "正在搜索可用列车...",
      searchingSubMessage: "请稍等片刻",
      searchResults: "搜索结果",
      noTrainsAvailable: "此日期没有可用列车",
      bookNow: "立即预订",
      fillAllFields: "请填写所有字段",
      errorOccurred: "搜索时发生错误，请重试。",
      stations: {
        "Tokyo": "东京",
        "Yokohama": "横滨",
        "Shizuoka": "静冈",
        "Osaka": "大阪",
        "Sannomiya": "三宫",
        "Himeji": "姬路",
        "Okayama": "冈山",
        "Takamatsu": "高松",
        "Izumoshi": "出云市"
      }
    },
    'zh-tw': {
      title: "JR「サンライズ瀬戸・出雲」列車 座位查詢",
      travelDates: "旅行日期",
      startDate: "開始日期",
      endDate: "結束日期",
      route: "路線",
      originStation: "出發站",
      destinationStation: "到達站",
      selectOriginStation: "請選擇出發站...",
      selectDestinationStation: "請選擇到達站...",
      searchAvailableTrains: "搜尋可用列車",
      searching: "搜尋中...",
      searchingMessage: "正在搜尋可用列車...",
      searchingSubMessage: "請稍等片刻",
      searchResults: "搜尋結果",
      noTrainsAvailable: "此日期沒有可用列車",
      bookNow: "立即預訂",
      fillAllFields: "請填寫所有欄位",
      errorOccurred: "搜尋時發生錯誤，請重試。",
      stations: {
        "Tokyo": "東京",
        "Yokohama": "橫濱",
        "Shizuoka": "靜岡",
        "Osaka": "大阪",
        "Sannomiya": "三宮",
        "Himeji": "姬路",
        "Okayama": "岡山",
        "Takamatsu": "高松",
        "Izumoshi": "出雲市"
      }
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh-cn', name: '简体中文', flag: '🇨🇳' },
    { code: 'zh-tw', name: '繁體中文', flag: '🇹🇼' }
  ];

  const t = translations[language];

  const originStations = ["Tokyo", "Yokohama", "Shizuoka", "Osaka", "Sannomiya", "Himeji", "Okayama", "Takamatsu", "Izumoshi"];

  const destinationLogic = {
    "Tokyo": ["Himeji", "Okayama", "Takamatsu", "Izumoshi"],
    "Yokohama": ["Himeji", "Okayama", "Takamatsu", "Izumoshi"],
    "Shizuoka": ["Yokohama", "Tokyo", "Himeji", "Okayama", "Takamatsu", "Izumoshi"],
    "Osaka": ["Takamatsu", "Izumoshi", "Shizuoka", "Yokohama", "Tokyo"],
    "Sannomiya": ["Takamatsu", "Izumoshi", "Shizuoka", "Yokohama", "Tokyo"], 
    "Himeji": ["Sannomiya", "Osaka", "Shizuoka", "Yokohama", "Tokyo", "Takamatsu", "Izumoshi"],
    "Okayama": ["Tokyo", "Takamatsu", "Izumoshi"],
    "Takamatsu": ["Okayama", "Osaka", "Yokohama", "Tokyo"],
    "Izumoshi": ["Okayama", "Osaka", "Yokohama", "Tokyo"]
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Set minimum and maximum dates based on GMT+9 timezone
  useEffect(() => {
    const now = new Date();
    const jstOffset = 9 * 60; // GMT+9 in minutes
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const jstNow = new Date(utc + jstOffset * 60000);
  
    // Determine REFERENCE DAY: tomorrow if after 11 PM (23:00), otherwise today
    let referenceDay = new Date(jstNow);
    if (jstNow.getHours() >= 23) {
      referenceDay.setDate(referenceDay.getDate() + 1);
    }

    // Start date: reference day to one month from reference day (inclusive)
    const startMin = new Date(referenceDay);
    const startMax = new Date(referenceDay);
    startMax.setMonth(startMax.getMonth() + 1);
  
    setMinStartDate(formatDate(startMin));
    setMaxStartDate(formatDate(startMax));
    setStartDate(formatDate(startMin));
    
    // Initially set end date same as start date
    setMinEndDate(formatDate(startMin));
    setMaxEndDate(formatDate(startMax));
    setEndDate(formatDate(startMin));
  }, []);

  // Update available destinations when origin changes
  useEffect(() => {
    if (originStation) {
      setAvailableDestinations(destinationLogic[originStation] || []);
      setDestinationStation('');
    }
  }, [originStation]);

  // Update end date restrictions when start date changes
  useEffect(() => {
    if (startDate && minStartDate) {
      const start = new Date(startDate);
      const referenceStart = new Date(minStartDate);
      const oneMonthFromReference = new Date(referenceStart);
      oneMonthFromReference.setMonth(oneMonthFromReference.getMonth() + 1);
  
      // Clamp startDate if somehow out of range
      if (start < referenceStart) {
        setStartDate(minStartDate);
        return;
      }
      if (start > oneMonthFromReference) {
        setStartDate(formatDate(oneMonthFromReference));
        return;
      }

      // End date restrictions: from startDate to one month from reference day (inclusive)
      setMinEndDate(formatDate(start));
      setMaxEndDate(formatDate(oneMonthFromReference));

      // Adjust endDate if it's now out of range
      const currentEnd = new Date(endDate);
      if (currentEnd < start) {
        setEndDate(formatDate(start));
      } else if (currentEnd > oneMonthFromReference) {
        setEndDate(formatDate(oneMonthFromReference));
      }
    }
  }, [startDate, minStartDate, endDate]);

  const formatDateForBackend = (dateStr) => {
    return dateStr.replace(/-/g, '');
  };

  const formatStationName = (station) => {
    return station === "Takamatsu" ? "Takamatsu%28Kagawa%20Pref.%29" : station;
  };

  // Function to call the API
  const checkAvailability = async (data) => {
    const response = await fetch('/api/check-availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleSearch = async () => {
    if (!startDate || !endDate || !originStation || !destinationStation) {
      alert(t.fillAllFields);
      return;
    }

    setLoading(true);
    setSearchResults({});

    try {
      const data = {
        departStName: formatStationName(originStation),
        arriveStName: formatStationName(destinationStation),
        startDate: formatDateForBackend(startDate),
        endDate: formatDateForBackend(endDate)
      };

      console.log('Sending to backend:', data);
      const results = await checkAvailability(data);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      alert(t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr.substring(0,4) + '-' + dateStr.substring(4,6) + '-' + dateStr.substring(6,8));
    const locale = language === 'ja' ? 'ja-JP' : 
                  language === 'zh-cn' ? 'zh-CN' :
                  language === 'zh-tw' ? 'zh-TW' : 'en-US';
    
    return date.toLocaleDateString(locale, { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const aggregateByTrain = (trains) => {
    const trainMap = {};
    
    trains.forEach(train => {
      if (!trainMap[train.trainName]) {
        trainMap[train.trainName] = {
          trainName: train.trainName,
          seatTypes: [],
          links: []
        };
      }
      trainMap[train.trainName].seatTypes.push(train.availableSeatType);
      trainMap[train.trainName].links.push(train.link);
    });

    return Object.values(trainMap);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none bg-transparent border-none p-3 pr-8 text-sm font-medium focus:outline-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-gray-700 font-medium text-lg">{t.searchingMessage}</p>
            <p className="text-gray-500 text-sm mt-2">{t.searchingSubMessage}</p>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <Train className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Calendar size={20} />
                <span>{t.travelDates}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t.startDate}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={minStartDate}
                    max={maxStartDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t.endDate}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={minEndDate}
                    max={maxEndDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Station Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <MapPin size={20} />
                <span>{t.route}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t.originStation}</label>
                  <select
                    value={originStation}
                    onChange={(e) => setOriginStation(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t.selectOriginStation}</option>
                    {originStations.map(station => (
                      <option key={station} value={station}>{t.stations[station]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t.destinationStation}</label>
                  <select
                    value={destinationStation}
                    onChange={(e) => setDestinationStation(e.target.value)}
                    disabled={!originStation}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{t.selectDestinationStation}</option>
                    {availableDestinations.map(station => (
                      <option key={station} value={station}>{t.stations[station]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !startDate || !endDate || !originStation || !destinationStation}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t.searching}
              </>
            ) : (
              <>
                <Clock size={20} />
                {t.searchAvailableTrains}
              </>
            )}
          </button>
        </div>

        {/* Search Results */}
        {Object.keys(searchResults).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.searchResults}</h2>
            
            {Object.entries(searchResults).map(([date, trains]) => (
              <div key={date} className="mb-8 last:mb-0">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                  {formatDisplayDate(date)}
                </h3>
                
                {trains.length === 0 ? (
                  <p className="text-gray-500 italic">{t.noTrainsAvailable}</p>
                ) : (
                  <div className="space-y-4">
                    {aggregateByTrain(trains).map((train, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-800">{train.trainName}</h4>
                          <div className="flex gap-2">
                            {train.links.slice(0, 1).map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                              >
                                {t.bookNow}
                                <ExternalLink size={16} />
                              </a>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {train.seatTypes.map((seatType, seatIndex) => (
                            <span
                              key={seatIndex}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {seatType}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
