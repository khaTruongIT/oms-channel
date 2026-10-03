import type { Article, Clinic, MedicalExpert, Product } from "./types";

export const experts: MedicalExpert[] = [
  {
    id: "expert-mai-anh",
    name: "ThS. BS. Nguyen Mai Anh",
    title: "Bac si Nhan khoa",
    credential: "12 nam kinh nghiem khuc xa lam sang",
    bio: "Phu trach tham dinh noi dung giao duc ve hoi chung thi giac man hinh va suc khoe thi luc.",
  },
  {
    id: "expert-hoang-nam",
    name: "BS. Hoang Nam",
    title: "Truong ban Khuc xa",
    credential: "Chuyen sau kinh da trong va vat lieu high-index",
    bio: "Tu van tieu chuan thau kinh, chi so khuc xa, va quy trinh do mat 12 buoc.",
  },
];

export const users = [
  {
    id: "user-admin-1",
    email: "admin@optiqis.vn",
    name: "System Admin",
    role: "ADMIN" as const,
    title: "Giam doc Ky thuat Platform",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-editor-1",
    email: "editor@optiqis.vn",
    name: "Thai Van Nam",
    role: "EDITOR" as const,
    title: "Bien tap vien Y khoa",
    degree: "Cu nhan Quang hoc",
    experience: "5 nam bien tap kien thuc khuc xa",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "user-reviewer-1",
    email: "reviewer@optiqis.vn",
    name: "BS.CKII Nguyen Minh Anh",
    role: "MEDICAL_REVIEWER" as const,
    title: "Chuyen gia Tham dinh Y khoa",
    degree: "BS.CKII Nhan khoa",
    experience: "15 nam tham dinh lam sang",
    avatarUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
  },
];

export const products: Product[] = [
  {
    id: "product-digital-shield",
    slug: "digital-shield-pro",
    name: "OPTIQIS Digital Shield Pro",
    line: "Digital Shield",
    summary:
      "Trong kinh loc anh sang xanh chon loc cho nguoi lam viec voi man hinh dai gio.",
    needs: ["screen", "office", "designer"],
    indexes: ["1.60", "1.67", "1.74"],
    coatings: ["Diamond Nano-S", "Hydrophobic", "True-Color"],
    technologies: ["Nano-AR", "Selective Wave Filtering", "True-Color"],
    heroImage:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
    specsJson: {
      abbe: "32-42 theo vat lieu",
      uvProtection: "UV400+",
      recommendedFor: ["Ky su phan mem", "Dan van phong", "Nha thiet ke mau"],
      wavelength: {
        adverse: "415-455nm",
        beneficial: "465-495nm",
        claim: "Giam dinh HEV co hai nhung giu can bang mau sac tu nhien.",
      },
    },
    isFeatured: true,
  },
  {
    id: "product-chroma-active",
    slug: "chroma-active",
    name: "OPTIQIS Chroma-Active",
    line: "Chroma-Active",
    summary: "Trong doi mau quang hoc cho moi truong trong nha va ngoai troi.",
    needs: ["outdoor", "daily"],
    indexes: ["1.56", "1.60", "1.67"],
    coatings: ["Photochromic", "Nano-AR"],
    technologies: ["Chromatic Gen8", "UV Adaptive"],
    heroImage:
      "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1200&q=80",
    specsJson: {
      abbe: "36-42",
      uvProtection: "UV400",
      recommendedFor: ["Nguoi di chuyen nhieu", "Nhan vien ngoai hien truong"],
      wavelength: {
        adverse: "UV va HEV cuong do cao",
        beneficial: "Anh sang kha kien can bang",
        claim: "Tu dieu chinh sac do theo moi truong anh sang.",
      },
    },
    isFeatured: true,
  },
  {
    id: "product-vista-free",
    slug: "vista-free-ultra",
    name: "OPTIQIS Vista-Free Ultra",
    line: "Vista-Free",
    summary: "Da trong ky thuat so cho nguoi buoc vao do tuoi lao thi 40+.",
    needs: ["presbyopia", "reading", "office"],
    indexes: ["1.60", "1.67", "1.74"],
    coatings: ["Free-Form", "Nano-AR"],
    technologies: ["Free-Form", "Wide Corridor"],
    heroImage:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    specsJson: {
      abbe: "32-42",
      uvProtection: "UV400",
      recommendedFor: ["Nguoi 40+", "Quan ly", "Nguoi doc tai lieu nhieu"],
      wavelength: {
        adverse: "Choi man hinh va den LED",
        beneficial: "Do sang vung gan-trung-xa",
        claim: "Toi uu chuyen tiep thi truong gan, trung va xa.",
      },
    },
    isFeatured: true,
  },
  {
    id: "product-ultra-thin",
    slug: "ultra-thin-174",
    name: "OPTIQIS Ultra-Thin 1.74 Diamond",
    line: "Ultra-Thin",
    summary: "Trong sieu mong cho do can cao can tham my va nhe hon.",
    needs: ["high-myopia", "thin-lens"],
    indexes: ["1.74"],
    coatings: ["Diamond Nano-S", "Anti-Scratch"],
    technologies: ["High-Index 1.74", "Aspheric Design"],
    heroImage:
      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
    specsJson: {
      abbe: "32",
      uvProtection: "UV400",
      recommendedFor: ["Do can tren -6.00D", "Gong khoan oc", "Canh mong"],
      wavelength: {
        adverse: "UV va loi loa noi bo",
        beneficial: "Do truyen sang cao",
        claim: "Giam do day bien trong khi giu do net trung tam.",
      },
    },
    isFeatured: false,
  },
  {
    id: "product-drive-clear",
    slug: "drive-clear-night-day",
    name: "OPTIQIS Drive-Clear Night & Day",
    line: "Drive-Clear",
    summary: "Giam choi khi lai xe ban dem va trong dieu kien mua uot.",
    needs: ["driving", "glare"],
    indexes: ["1.56", "1.60", "1.67"],
    coatings: ["Anti-Glare", "Hydrophobic"],
    technologies: ["Glare Control", "Contrast Boost"],
    heroImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    specsJson: {
      abbe: "36-42",
      uvProtection: "UV400",
      recommendedFor: ["Tai xe", "Nguoi hay di dem", "Nguoi nhay cam voi choi"],
      wavelength: {
        adverse: "Choi tu LED va den pha",
        beneficial: "Tuong phan bien duong",
        claim: "Ho tro cam nhan tuong phan trong boi canh anh sang phuc tap.",
      },
    },
    isFeatured: false,
  },
  {
    id: "product-junior-care",
    slug: "junior-care-myopia",
    name: "OPTIQIS Junior Care Myopia",
    line: "Junior Care",
    summary: "Giai phap cho tre 6-16 tuoi can theo doi tien trien can thi.",
    needs: ["children", "myopia-control"],
    indexes: ["1.56", "1.60"],
    coatings: ["Impact Resistant", "UV400"],
    technologies: ["D.I.M.S Multi-Segment", "Polycarbonate"],
    heroImage:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    specsJson: {
      abbe: "30-42",
      uvProtection: "UV400",
      recommendedFor: ["Tre 6-16 tuoi", "Phu huynh theo doi can thi"],
      wavelength: {
        adverse: "UV va va dap co hoc",
        beneficial: "Vung nhin hoc tap on dinh",
        claim: "Can duoc tu van boi bac si/chuyen vien khuc xa truoc khi dung.",
      },
    },
    isFeatured: false,
  },
];

function productById(id: string): Product {
  const product = products.find((item) => item.id === id);
  if (!product) {
    throw new Error(`Missing seed product: ${id}`);
  }

  return product;
}

export const articles: Article[] = [
  {
    id: "article-cvs-blue-light",
    slug: "hoi-chung-cvs-anh-sang-xanh",
    title:
      "Hoi chung thi giac man hinh: vi sao anh sang xanh khien mat moi va kho rat?",
    excerpt:
      "Tong quan ve digital eye strain, quy tac 20-20-20 va cach loc quang pho co chon loc.",
    category: "CVS",
    tags: ["cvs", "anh-sang-xanh", "20-20-20"],
    status: "PUBLISHED",
    seoTitle: "Hoi chung CVS va anh sang xanh | OPTIQIS",
    seoDescription:
      "Tim hieu hoi chung thi giac man hinh, quy tac 20-20-20 va cac giai phap trong kinh loc quang pho co chon loc.",
    seoScore: 92,
    authorId: "expert-hoang-nam",
    reviewerId: "expert-mai-anh",
    publishedAt: "2026-05-18T09:00:00.000Z",
    scheduledAt: null,
    contentJson: [
      {
        id: "b1",
        type: "heading",
        text: "Digital eye strain la gi?",
      },
      {
        id: "b2",
        type: "paragraph",
        text: "AOA mo ta computer vision syndrome la nhom van de ve mat va thi giac lien quan den viec su dung may tinh, may tinh bang va dien thoai trong thoi gian dai.",
      },
      {
        id: "b3",
        type: "callout",
        text: "Noi dung nay chi mang tinh giao duc, khong thay the chan doan hoac phac do dieu tri ca nhan.",
      },
      {
        id: "b4",
        type: "heading",
        text: "Quy tac 20-20-20",
      },
      {
        id: "b5",
        type: "paragraph",
        text: "Sau moi 20 phut lam viec gan, hay nhin mot vat cach khoang 20 feet trong 20 giay de giam tai dieu tiet.",
      },
      {
        id: "b6",
        type: "reference",
        text: "Nguon tham khao: American Optometric Association; ISO 8980-3:2022; EyeWiki/AAO digital eye strain.",
      },
    ],
    relatedProducts: [productById("product-digital-shield")],
  },
  {
    id: "article-index-guide",
    slug: "chon-chiet-suat-156-160-167-174",
    title: "Cam nang chon chiet suat trong kinh 1.56, 1.60, 1.67 va 1.74",
    excerpt:
      "Cach hieu do day, trong luong, he so Abbe va do phu hop theo do khuc xa.",
    category: "Guide",
    tags: ["chiet-suat", "abbe", "high-index"],
    status: "PUBLISHED",
    seoTitle: "Chon chiet suat trong kinh 1.56 den 1.74",
    seoDescription:
      "Huong dan chon chiet suat trong kinh theo do can/vien/loan, do day bien va nhu cau tham my.",
    seoScore: 88,
    authorId: "expert-hoang-nam",
    reviewerId: "expert-mai-anh",
    publishedAt: "2026-04-20T09:00:00.000Z",
    scheduledAt: null,
    contentJson: [
      {
        id: "b1",
        type: "heading",
        text: "Vi sao chiet suat quan trong?",
      },
      {
        id: "b2",
        type: "paragraph",
        text: "Chiet suat cao giup trong mong hon, nhung can can bang voi chat lieu, Abbe, thiet ke gong va nhu cau thi giac.",
      },
      {
        id: "b3",
        type: "reference",
        text: "Nguon tham khao: ISO 14889 va ISO 8980 series ve yeu cau kinh thuoc va truyen qua cua trong kinh.",
      },
    ],
    relatedProducts: [
      productById("product-vista-free"),
      productById("product-ultra-thin"),
    ],
  },
  {
    id: "article-dims",
    slug: "dims-kiem-soat-can-thi-tre-em",
    title: "D.I.M.S va kiem soat tien trien can thi hoc duong",
    excerpt:
      "Tom tat co che defocus va nhung diem phu huynh can hoi bac si truoc khi lua chon.",
    category: "Myopia",
    tags: ["dims", "can-thi", "tre-em"],
    status: "PENDING_MEDICAL_REVIEW",
    seoTitle: "D.I.M.S kiem soat can thi tre em",
    seoDescription:
      "Tim hieu cong nghe D.I.M.S, co che myopic defocus va cac luu y khi tu van cho tre can thi.",
    seoScore: 76,
    authorId: "expert-hoang-nam",
    reviewerId: "expert-mai-anh",
    publishedAt: null,
    scheduledAt: null,
    contentJson: [
      {
        id: "b1",
        type: "heading",
        text: "D.I.M.S la gi?",
      },
      {
        id: "b2",
        type: "paragraph",
        text: "Cac nghien cuu lam sang ve Defocus Incorporated Multiple Segments cho thay tiem nang lam cham tien trien can thi va truc nhan cau o tre.",
      },
      {
        id: "b3",
        type: "callout",
        text: "Tre em can duoc do khuc xa va theo doi boi chuyen vien truoc khi lua chon giai phap kiem soat can thi.",
      },
    ],
    relatedProducts: [productById("product-junior-care")],
  },
];

export const clinics: Clinic[] = [
  {
    id: "clinic-hcm-1",
    name: "Trung tam Khuc xa OPTIQIS Quan 1",
    province: "TP. Ho Chi Minh",
    district: "Quan 1",
    address: "24 Nguyen Hue, Phuong Ben Nghe",
    hotline: "1800 6919",
    hours: "08:00 - 20:30",
    lat: 10.7758,
    lng: 106.7009,
    services: ["Do mat 12 buoc", "Tu van Digital Shield", "Da trong 40+"],
  },
  {
    id: "clinic-hcm-2",
    name: "Phong kham Mat Sai Gon - Doi tac OPTIQIS",
    province: "TP. Ho Chi Minh",
    district: "Quan 3",
    address: "280 Dien Bien Phu, Phuong 7",
    hotline: "1800 6919",
    hours: "07:30 - 19:00",
    lat: 10.7824,
    lng: 106.6842,
    services: ["Do khuc xa tre em", "D.I.M.S", "UV400"],
  },
  {
    id: "clinic-hn-1",
    name: "OPTIQIS Vision Lab Hoan Kiem",
    province: "Ha Noi",
    district: "Hoan Kiem",
    address: "12 Ly Thai To, Hoan Kiem",
    hotline: "1800 6919",
    hours: "08:00 - 20:00",
    lat: 21.0285,
    lng: 105.8542,
    services: ["Do mat 12 buoc", "High-index 1.74", "Drive-Clear"],
  },
  {
    id: "clinic-dn-1",
    name: "OPTIQIS Authorized Center Da Nang",
    province: "Da Nang",
    district: "Hai Chau",
    address: "88 Bach Dang, Hai Chau",
    hotline: "1800 6919",
    hours: "08:00 - 19:30",
    lat: 16.0678,
    lng: 108.2208,
    services: ["Do mat mien phi", "Chroma-Active", "Kiem tra gong"],
  },
];
