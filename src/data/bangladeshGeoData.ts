import type { BangladeshDistrict } from '../types/civicsphere';

export interface BangladeshDivision {
  id: string;
  nameEn: string;
  nameBn: string;
  colorHex: string;
}

export const BANGLADESH_DIVISIONS: BangladeshDivision[] = [
  { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', colorHex: '#0284c7' },
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', colorHex: '#0891b2' },
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', colorHex: '#2563eb' },
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', colorHex: '#0d9488' },
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', colorHex: '#4f46e5' },
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', colorHex: '#059669' },
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', colorHex: '#7c3aed' },
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', colorHex: '#0369a1' },
];

// Geographic projection bounds for Bangladesh SVG canvas (viewBox 0 0 600 760)
export const BD_MAP_BOUNDS = {
  minLng: 87.95,
  maxLng: 92.75,
  minLat: 20.55,
  maxLat: 26.68,
  width: 600,
  height: 760,
};

export function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const x =
    ((lng - BD_MAP_BOUNDS.minLng) / (BD_MAP_BOUNDS.maxLng - BD_MAP_BOUNDS.minLng)) *
    (BD_MAP_BOUNDS.width - 60) +
    30;
  const y =
    ((BD_MAP_BOUNDS.maxLat - lat) / (BD_MAP_BOUNDS.maxLat - BD_MAP_BOUNDS.minLat)) *
    (BD_MAP_BOUNDS.height - 60) +
    30;
  return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
}

// Calibrated geographic silhouette path of Bangladesh matching projectLatLng coordinates
export const BANGLADESH_OUTLINE_PATH = (() => {
  const borderPoints: Array<[number, number]> = [
    [26.63, 88.42], [26.45, 88.95], [26.28, 89.48], [26.05, 89.88],
    [25.65, 89.84], [25.25, 89.88], [25.18, 90.35], [25.18, 91.15],
    [25.19, 91.95], [25.05, 92.48], [24.65, 92.35], [24.18, 91.92],
    [24.22, 91.50], [23.85, 91.26], [23.45, 91.25], [23.02, 91.54],
    [23.38, 91.98], [23.62, 92.45], [22.95, 92.42], [22.15, 92.55],
    [21.38, 92.40], [20.78, 92.34], [20.85, 92.18], [21.45, 91.94],
    [22.12, 91.85], [22.45, 91.45], [22.85, 91.05], [22.45, 90.62],
    [21.85, 90.22], [21.92, 89.65], [21.72, 89.05], [22.35, 88.92],
    [23.05, 88.88], [23.65, 88.62], [24.22, 88.58], [24.52, 88.15],
    [24.98, 88.24], [25.62, 88.45], [26.15, 88.18], [26.63, 88.42],
  ];
  return (
    'M ' +
    borderPoints
      .map(([lat, lng]) => {
        const { x, y } = projectLatLng(lat, lng);
        return `${x} ${y}`;
      })
      .join(' L ') +
    ' Z'
  );
})();

interface DistrictSeed {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionId: string;
  lat: number;
  lng: number;
  pop: string;
  muniType?: 'City Corporation' | 'Pourashava' | 'District HQ';
  mayor?: string;
  upazilas?: string[];
  transparencyScore?: number;
  resolutionRate?: number;
  satisfaction?: number;
}

const DISTRICT_SEEDS: DistrictSeed[] = [
  // Dhaka Division (13 districts)
  { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', divisionId: 'dhaka', lat: 23.8103, lng: 90.4125, pop: '14.7M (Metro)', muniType: 'City Corporation', mayor: 'Dhaka North & South City Administrator', upazilas: ['Dhamrai', 'Dohar', 'Keraniganj', 'Nawabganj', 'Savar'], transparencyScore: 84, resolutionRate: 81, satisfaction: 4.1 },
  { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', divisionId: 'dhaka', lat: 24.0023, lng: 90.4264, pop: '5.2M', muniType: 'City Corporation', mayor: 'Gazipur City Corporation Panel', upazilas: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur'], transparencyScore: 76, resolutionRate: 74, satisfaction: 3.8 },
  { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionId: 'dhaka', lat: 23.6238, lng: 90.5000, pop: '3.9M', muniType: 'City Corporation', mayor: 'Narayanganj City Corporation Office', upazilas: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon'], transparencyScore: 86, resolutionRate: 83, satisfaction: 4.3 },
  { id: 'tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', divisionId: 'dhaka', lat: 24.2513, lng: 89.9167, pop: '4.0M', muniType: 'Pourashava', upazilas: ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Madhupur', 'Mirzapur', 'Sakhipur'] },
  { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', divisionId: 'dhaka', lat: 23.9322, lng: 90.7154, pop: '2.5M', muniType: 'Pourashava', upazilas: ['Belabo', 'Monohardi', 'Narsingdi Sadar', 'Palash', 'Raipura', 'Shibpur'] },
  { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', divisionId: 'dhaka', lat: 23.5422, lng: 90.5305, pop: '1.6M', muniType: 'Pourashava', upazilas: ['Gazaria', 'Lohajang', 'Munshiganj Sadar', 'Sirajdikhan', 'Sreenagar', 'Tongibari'] },
  { id: 'manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', divisionId: 'dhaka', lat: 23.8617, lng: 90.0003, pop: '1.5M', muniType: 'Pourashava', upazilas: ['Daulatpur', 'Ghior', 'Harirampur', 'Manikganj Sadar', 'Saturia', 'Shivalaya', 'Singair'] },
  { id: 'faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', divisionId: 'dhaka', lat: 23.6071, lng: 89.8429, pop: '2.1M', muniType: 'Pourashava', upazilas: ['Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Faridpur Sadar', 'Madhukhali', 'Nagarkanda', 'Sadarpur'] },
  { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', divisionId: 'dhaka', lat: 23.0051, lng: 89.8266, pop: '1.3M', muniType: 'Pourashava', upazilas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'] },
  { id: 'madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', divisionId: 'dhaka', lat: 23.1641, lng: 90.1897, pop: '1.3M', muniType: 'Pourashava', upazilas: ['Kalkini', 'Madaripur Sadar', 'Rajoir', 'Shibchar', 'Dasar'] },
  { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', divisionId: 'dhaka', lat: 23.2423, lng: 90.4348, pop: '1.3M', muniType: 'Pourashava', upazilas: ['Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Shariatpur Sadar', 'Zajira'] },
  { id: 'rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', divisionId: 'dhaka', lat: 23.7574, lng: 89.6445, pop: '1.2M', muniType: 'Pourashava', upazilas: ['Baliakandi', 'Goalandaghat', 'Kalukhali', 'Pangsha', 'Rajbari Sadar'] },
  { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', divisionId: 'dhaka', lat: 24.4449, lng: 90.7766, pop: '3.2M', muniType: 'Pourashava', upazilas: ['Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kishoreganj Sadar', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'] },

  // Chattogram Division (11 districts)
  { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', divisionId: 'chattogram', lat: 22.3569, lng: 91.7832, pop: '9.1M', muniType: 'City Corporation', mayor: 'Chattogram City Corporation Administrator', upazilas: ['Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda'], transparencyScore: 82, resolutionRate: 79, satisfaction: 4.0 },
  { id: 'coxsbazar', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার', divisionId: 'chattogram', lat: 21.4272, lng: 92.0058, pop: '2.8M', muniType: 'Pourashava', upazilas: ["Cox's Bazar Sadar", 'Chakaria', 'Eidgaon', 'Kutubdia', 'Maheshkhali', 'Pekua', 'Ramu', 'Teknaf', 'Ukhia'], transparencyScore: 78, resolutionRate: 75, satisfaction: 3.9 },
  { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', divisionId: 'chattogram', lat: 23.4607, lng: 91.1809, pop: '6.2M', muniType: 'City Corporation', mayor: 'Cumilla City Corporation Office', upazilas: ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Cumilla Adarsha Sadar', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Meghna', 'Muradnagar', 'Nangalkot', 'Titas'], transparencyScore: 81, resolutionRate: 78, satisfaction: 4.0 },
  { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', divisionId: 'chattogram', lat: 23.9571, lng: 91.1115, pop: '3.3M', muniType: 'Pourashava', upazilas: ['Akhaura', 'Ashuganj', 'Bancharampur', 'Bijoynagar', 'Brahmanbaria Sadar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail'] },
  { id: 'chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', divisionId: 'chattogram', lat: 23.2333, lng: 90.6713, pop: '2.6M', muniType: 'Pourashava', upazilas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'] },
  { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', divisionId: 'chattogram', lat: 23.0159, lng: 91.3976, pop: '1.6M', muniType: 'Pourashava', upazilas: ['Chhagalnaiya', 'Daganbhuiyan', 'Feni Sadar', 'Fulgazi', 'Parshuram', 'Sonagazi'] },
  { id: 'noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', divisionId: 'chattogram', lat: 22.8696, lng: 91.0994, pop: '3.6M', muniType: 'Pourashava', upazilas: ['Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Noakhali Sadar', 'Senbagh', 'Sonaimuri', 'Subarnachar'] },
  { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', divisionId: 'chattogram', lat: 22.9447, lng: 90.8282, pop: '1.9M', muniType: 'Pourashava', upazilas: ['Kamalnagar', 'Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati'] },
  { id: 'rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', divisionId: 'chattogram', lat: 22.7324, lng: 92.2985, pop: '0.65M', muniType: 'Pourashava', upazilas: ['Baghaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali', 'Rangamati Sadar'] },
  { id: 'khagrachhari', nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি', divisionId: 'chattogram', lat: 23.1193, lng: 91.9847, pop: '0.71M', muniType: 'Pourashava', upazilas: ['Dighinala', 'Guimara', 'Khagrachhari Sadar', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'] },
  { id: 'bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', divisionId: 'chattogram', lat: 22.1953, lng: 92.2184, pop: '0.48M', muniType: 'Pourashava', upazilas: ['Alikadam', 'Bandarban Sadar', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'] },

  // Rajshahi Division (8 districts)
  { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', divisionId: 'rajshahi', lat: 24.3745, lng: 88.6042, pop: '2.9M', muniType: 'City Corporation', mayor: 'Rajshahi City Corporation Office', upazilas: ['Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'], transparencyScore: 89, resolutionRate: 86, satisfaction: 4.5 },
  { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', divisionId: 'rajshahi', lat: 24.8465, lng: 89.3773, pop: '3.7M', muniType: 'Pourashava', upazilas: ['Adamdighi', 'Bogura Sadar', 'Dhunat', 'Dupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'], transparencyScore: 80, resolutionRate: 77, satisfaction: 4.0 },
  { id: 'pabna', nameEn: 'Pabna', nameBn: 'পাবনা', divisionId: 'rajshahi', lat: 24.0064, lng: 89.2372, pop: '2.9M', muniType: 'Pourashava', upazilas: ['Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Pabna Sadar', 'Santhia', 'Sujanagar'] },
  { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', divisionId: 'rajshahi', lat: 24.4534, lng: 89.7007, pop: '3.4M', muniType: 'Pourashava', upazilas: ['Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Sirajganj Sadar', 'Tarash', 'Ullapara'] },
  { id: 'naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', divisionId: 'rajshahi', lat: 24.7936, lng: 88.9318, pop: '2.8M', muniType: 'Pourashava', upazilas: ['Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Naogaon Sadar', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'] },
  { id: 'natore', nameEn: 'Natore', nameBn: 'নাটোর', divisionId: 'rajshahi', lat: 24.4206, lng: 89.0003, pop: '1.9M', muniType: 'Pourashava', upazilas: ['Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Naldanga', 'Natore Sadar', 'Singra'] },
  { id: 'chapainawabganj', nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', divisionId: 'rajshahi', lat: 24.5965, lng: 88.2775, pop: '1.8M', muniType: 'Pourashava', upazilas: ['Bholahat', 'Chapainawabganj Sadar', 'Gomastapur', 'Nachole', 'Shibganj'] },
  { id: 'joypurhat', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', divisionId: 'rajshahi', lat: 25.0968, lng: 89.0227, pop: '0.96M', muniType: 'Pourashava', upazilas: ['Akkelpur', 'Joypurhat Sadar', 'Kalai', 'Khetlal', 'Panchbibi'] },

  // Khulna Division (10 districts)
  { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', divisionId: 'khulna', lat: 22.8456, lng: 89.5403, pop: '2.6M', muniType: 'City Corporation', mayor: 'Khulna City Corporation Office', upazilas: ['Batiaghata', 'Dacope', 'Dighalia', 'Dumuria', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'], transparencyScore: 83, resolutionRate: 80, satisfaction: 4.1 },
  { id: 'jashore', nameEn: 'Jashore', nameBn: 'যশোর', divisionId: 'khulna', lat: 23.1664, lng: 89.2081, pop: '3.1M', muniType: 'Pourashava', upazilas: ['Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jashore Sadar', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'], transparencyScore: 82, resolutionRate: 79, satisfaction: 4.1 },
  { id: 'satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', divisionId: 'khulna', lat: 22.7185, lng: 89.0705, pop: '2.2M', muniType: 'Pourashava', upazilas: ['Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Satkhira Sadar', 'Shyamnagar', 'Tala'] },
  { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', divisionId: 'khulna', lat: 22.6516, lng: 89.7859, pop: '1.6M', muniType: 'Pourashava', upazilas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'] },
  { id: 'kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', divisionId: 'khulna', lat: 23.9013, lng: 89.1205, pop: '2.1M', muniType: 'Pourashava', upazilas: ['Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Kushtia Sadar', 'Mirpur'] },
  { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', divisionId: 'khulna', lat: 23.5448, lng: 89.1539, pop: '2.0M', muniType: 'Pourashava', upazilas: ['Harinakunda', 'Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'] },
  { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', divisionId: 'khulna', lat: 23.6402, lng: 88.8418, pop: '1.2M', muniType: 'Pourashava', upazilas: ['Alamdanga', 'Chuadanga Sadar', 'Damurhuda', 'Jibannagar'] },
  { id: 'meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', divisionId: 'khulna', lat: 23.7622, lng: 88.6318, pop: '0.71M', muniType: 'Pourashava', upazilas: ['Gangni', 'Meherpur Sadar', 'Mujibnagar'] },
  { id: 'magura', nameEn: 'Magura', nameBn: 'মাগুরা', divisionId: 'khulna', lat: 23.4873, lng: 89.4199, pop: '1.0M', muniType: 'Pourashava', upazilas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'] },
  { id: 'narail', nameEn: 'Narail', nameBn: 'নড়াইল', divisionId: 'khulna', lat: 23.1725, lng: 89.5127, pop: '0.79M', muniType: 'Pourashava', upazilas: ['Kalia', 'Lohagara', 'Narail Sadar'] },

  // Barishal Division (6 districts)
  { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', divisionId: 'barishal', lat: 22.7010, lng: 90.3535, pop: '2.6M', muniType: 'City Corporation', mayor: 'Barishal City Corporation Office', upazilas: ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Barishal Sadar', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'], transparencyScore: 79, resolutionRate: 76, satisfaction: 3.9 },
  { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', divisionId: 'barishal', lat: 22.3596, lng: 90.3299, pop: '1.7M', muniType: 'Pourashava', upazilas: ['Bauphal', 'Dashmina', 'Dumki', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Patuakhali Sadar', 'Rangabali'] },
  { id: 'bhola', nameEn: 'Bhola', nameBn: 'ভোলা', divisionId: 'barishal', lat: 22.6859, lng: 90.6482, pop: '1.9M', muniType: 'Pourashava', upazilas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'] },
  { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', divisionId: 'barishal', lat: 22.5841, lng: 89.9720, pop: '1.2M', muniType: 'Pourashava', upazilas: ['Bhandaria', 'Indurkani', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Pirojpur Sadar'] },
  { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', divisionId: 'barishal', lat: 22.6406, lng: 90.1987, pop: '0.66M', muniType: 'Pourashava', upazilas: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'] },
  { id: 'barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', divisionId: 'barishal', lat: 22.1591, lng: 90.1264, pop: '1.0M', muniType: 'Pourashava', upazilas: ['Amtali', 'Bamna', 'Barguna Sadar', 'Betagi', 'Patharghata', 'Taltali'] },

  // Sylhet Division (4 districts)
  { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', divisionId: 'sylhet', lat: 24.8949, lng: 91.8687, pop: '3.8M', muniType: 'City Corporation', mayor: 'Sylhet City Corporation Office', upazilas: ['Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'Sylhet Sadar', 'Zakiganj'], transparencyScore: 85, resolutionRate: 82, satisfaction: 4.2 },
  { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', divisionId: 'sylhet', lat: 24.4829, lng: 91.7774, pop: '2.1M', muniType: 'Pourashava', upazilas: ['Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Moulvibazar Sadar', 'Rajnagar', 'Sreemangal'] },
  { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', divisionId: 'sylhet', lat: 24.3749, lng: 91.4155, pop: '2.4M', muniType: 'Pourashava', upazilas: ['Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Habiganj Sadar', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shaistaganj'] },
  { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', divisionId: 'sylhet', lat: 25.0658, lng: 91.3950, pop: '2.7M', muniType: 'Pourashava', upazilas: ['Bishwamvarpur', 'Chhatak', 'Derai', 'Dharamapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Madhyanagar', 'Shalla', 'Sunamganj Sadar', 'Sullah', 'Tahirpur'] },

  // Rangpur Division (8 districts)
  { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', divisionId: 'rangpur', lat: 25.7439, lng: 89.2752, pop: '3.2M', muniType: 'City Corporation', mayor: 'Rangpur City Corporation Office', upazilas: ['Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Rangpur Sadar', 'Taraganj'], transparencyScore: 81, resolutionRate: 78, satisfaction: 4.0 },
  { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', divisionId: 'rangpur', lat: 25.6217, lng: 88.6354, pop: '3.3M', muniType: 'Pourashava', upazilas: ['Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Dinajpur Sadar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'] },
  { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', divisionId: 'rangpur', lat: 25.3288, lng: 89.5281, pop: '2.6M', muniType: 'Pourashava', upazilas: ['Fulchhari', 'Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'] },
  { id: 'kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', divisionId: 'rangpur', lat: 25.8054, lng: 89.6362, pop: '2.3M', muniType: 'Pourashava', upazilas: ['Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Kurigram Sadar', 'Nageshwari', 'Phulbari', 'Rajarhat', 'Raomari', 'Ulipur'] },
  { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', divisionId: 'rangpur', lat: 25.9923, lng: 89.2847, pop: '1.4M', muniType: 'Pourashava', upazilas: ['Aditmari', 'Hatibandha', 'Kaliganj', 'Lalmonirhat Sadar', 'Patgram'] },
  { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', divisionId: 'rangpur', lat: 25.9318, lng: 88.8560, pop: '2.1M', muniType: 'Pourashava', upazilas: ['Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Nilphamari Sadar', 'Saidpur'] },
  { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', divisionId: 'rangpur', lat: 26.3411, lng: 88.5542, pop: '1.2M', muniType: 'Pourashava', upazilas: ['Atwari', 'Boda', 'Debiganj', 'Panchagarh Sadar', 'Tetulia'] },
  { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', divisionId: 'rangpur', lat: 26.0337, lng: 88.4617, pop: '1.5M', muniType: 'Pourashava', upazilas: ['Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail', 'Thakurgaon Sadar'] },

  // Mymensingh Division (4 districts)
  { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', divisionId: 'mymensingh', lat: 24.7471, lng: 90.4203, pop: '5.9M', muniType: 'City Corporation', mayor: 'Mymensingh City Corporation Office', upazilas: ['Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Mymensingh Sadar', 'Nandail', 'Phulpur', 'Tara Khanda', 'Trishal'], transparencyScore: 80, resolutionRate: 77, satisfaction: 4.0 },
  { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', divisionId: 'mymensingh', lat: 24.9375, lng: 89.9378, pop: '2.5M', muniType: 'Pourashava', upazilas: ['Bakshiganj', 'Dewanganj', 'Islampur', 'Jamalpur Sadar', 'Madarganj', 'Melandaha', 'Sarishabari'] },
  { id: 'netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', divisionId: 'mymensingh', lat: 24.8709, lng: 90.7279, pop: '2.3M', muniType: 'Pourashava', upazilas: ['Atpara', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Khaliajuri', 'Madan', 'Mohanganj', 'Netrokona Sadar', 'Purbadhala'] },
  { id: 'sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', divisionId: 'mymensingh', lat: 25.0205, lng: 90.0153, pop: '1.5M', muniType: 'Pourashava', upazilas: ['Jhenaigati', 'Nakla', 'Nalitabari', 'Sherpur Sadar', 'Sreebardi'] },
];

const DIVISION_MAP = new Map(BANGLADESH_DIVISIONS.map((d) => [d.id, d]));

export const BANGLADESH_DISTRICTS: BangladeshDistrict[] = DISTRICT_SEEDS.map((seed, idx) => {
  const div = DIVISION_MAP.get(seed.divisionId)!;
  const muniType = seed.muniType ?? 'Pourashava';
  const tScore = seed.transparencyScore ?? 71 + ((idx * 7) % 16);
  const rRate = seed.resolutionRate ?? 68 + ((idx * 5) % 18);
  const sat = seed.satisfaction ?? Number((3.6 + ((idx * 3) % 9) * 0.1).toFixed(1));
  const alloc = 42 + ((idx * 13) % 140);
  const spent = Number((alloc * (0.64 + ((idx * 4) % 22) / 100)).toFixed(1));

  return {
    id: seed.id,
    nameEn: seed.nameEn,
    nameBn: seed.nameBn,
    divisionId: seed.divisionId,
    divisionEn: div.nameEn,
    divisionBn: div.nameBn,
    lat: seed.lat,
    lng: seed.lng,
    populationEst: seed.pop,
    municipalityType: muniType,
    mayorOrAdmin: seed.mayor ?? `${seed.nameEn} Pourashava Administrator`,
    upazilas: seed.upazilas ?? [`${seed.nameEn} Sadar`, 'North Upazila', 'South Upazila'],
    wards: ['Ward 01', 'Ward 02', 'Ward 03', 'Ward 04', 'Ward 05', 'Ward 06', 'Ward 07', 'Ward 08', 'Ward 09'],
    offices: [
      {
        name: `${seed.nameEn} ${muniType} Citizen Service Desk`,
        type: 'Municipality',
        address: `Town Hall Road, ${seed.nameEn} Sadar`,
        phone: '333 (National Info)',
        accessible: true,
      },
      {
        name: `${seed.nameEn} Sadar Ward 01–03 Facilitation Center`,
        type: 'Ward Office',
        address: `Ward Complex, Central ${seed.nameEn}`,
        accessible: true,
      },
      {
        name: `${seed.nameEn} 250-Bed District General Hospital`,
        type: 'Hospital',
        address: `Hospital Road, ${seed.nameEn}`,
        phone: '16263 (Shastho Batayon)',
        accessible: true,
      },
      {
        name: `${seed.nameEn} Community Clinic Hub`,
        type: 'Clinic',
        address: `Union Health Complex, ${seed.nameEn}`,
        accessible: false,
      },
      {
        name: `${seed.nameEn} Sadar Model Police Station`,
        type: 'Police',
        address: `Kotwali Circle, ${seed.nameEn}`,
        phone: '999',
        accessible: true,
      },
      {
        name: `${seed.nameEn} Fire Service & Civil Defence Station`,
        type: 'Fire',
        address: `Station Road, ${seed.nameEn}`,
        phone: '16163',
        accessible: true,
      },
      {
        name: `${seed.nameEn} Zilla Legal Aid Office (NLASO)`,
        type: 'Legal Aid',
        address: `District Judge Court Building, ${seed.nameEn}`,
        phone: '16430',
        accessible: true,
      },
      {
        name: `${seed.nameEn} Government Zilla School & College`,
        type: 'School',
        address: `College Avenue, ${seed.nameEn}`,
        accessible: true,
      },
    ],
    dashboard: {
      activeProjects: 6 + (idx % 9),
      completedProjects: 14 + (idx % 12),
      allocatedBudgetCrore: alloc,
      spentBudgetCrore: spent,
      complaintsReceived: 120 + ((idx * 29) % 340),
      complaintResolutionRate: rRate,
      satisfactionRating: sat,
      transparencyScore: tScore,
      projects: [
        {
          id: `${seed.id}_p1`,
          titleEn: `${seed.nameEn} Accessible Drainage & Pedestrian Sidewalk Upgrade`,
          titleBn: `${seed.nameBn} প্রবেশগম্য ড্রেনেজ ও ফুটপাত উন্নয়ন প্রকল্প`,
          budgetCrore: Number((alloc * 0.38).toFixed(1)),
          spentCrore: Number((alloc * 0.34).toFixed(1)),
          status: 'On Track',
          progress: 78,
        },
        {
          id: `${seed.id}_p2`,
          titleEn: `${seed.nameEn} Solar Streetlighting & Safe Transit Corridors`,
          titleBn: `${seed.nameBn} সোলার সড়কবাতি ও নিরাপদ চলাচল করিডোর`,
          budgetCrore: Number((alloc * 0.27).toFixed(1)),
          spentCrore: Number((alloc * 0.27).toFixed(1)),
          status: 'Completed',
          progress: 100,
        },
        {
          id: `${seed.id}_p3`,
          titleEn: `${seed.nameEn} Municipal E-Waste & Clean Water Station`,
          titleBn: `${seed.nameBn} পৌর বর্জ্য ব্যবস্থাপনা ও বিশুদ্ধ পানি কেন্দ্র`,
          budgetCrore: Number((alloc * 0.35).toFixed(1)),
          spentCrore: Number((alloc * 0.14).toFixed(1)),
          status: idx % 3 === 0 ? 'Delayed' : 'On Track',
          progress: idx % 3 === 0 ? 41 : 64,
        },
      ],
      councillors: [
        { name: `Ward 01 Representative (${seed.nameEn})`, ward: 'Ward 01', portfolio: 'Sanitation & Water' },
        { name: `Ward 02 Representative (${seed.nameEn})`, ward: 'Ward 02', portfolio: 'Roads & Streetlights' },
        { name: `Reserved Women Councillor (${seed.nameEn})`, ward: 'Wards 01–03', portfolio: 'Social Protection & Inclusion' },
      ],
      notices: [
        {
          id: `${seed.id}_n1`,
          titleEn: `Quarterly Open Budget Hearing — ${seed.nameEn} ${muniType}`,
          titleBn: `${seed.nameBn} ${muniType === 'City Corporation' ? 'সিটি কর্পোরেশন' : 'পৌরসভা'} উন্মুক্ত বাজেট গণশুনানি`,
          date: '2026-11-24',
        },
        {
          id: `${seed.id}_n2`,
          titleEn: `Disability & Elderly Allowance Verification Desk Open (Ward 01–09)`,
          titleBn: `প্রতিবন্ধী ও বয়স্ক ভাতা যাচাইকরণ ডেস্ক চালু`,
          date: '2026-11-19',
        },
      ],
    },
  };
});
