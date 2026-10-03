import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { articleStatuses, leadSources, leadStatuses, userRoles } from "@optiqis/shared";

export class ProductWavelengthDto {
  @ApiProperty({ example: "415-455nm", type: String })
  adverse!: string;

  @ApiProperty({ example: "465-495nm", type: String })
  beneficial!: string;

  @ApiProperty({ example: "Giam dinh HEV co hai nhung giu can bang mau sac tu nhien.", type: String })
  claim!: string;
}

export class ProductSpecsDto {
  @ApiProperty({ example: "32-42 theo vat lieu", type: String })
  abbe!: string;

  @ApiProperty({ example: "UV400+", type: String })
  uvProtection!: string;

  @ApiProperty({ example: ["Ky su phan mem", "Dan van phong"], type: [String] })
  recommendedFor!: string[];

  @ApiProperty({ type: () => ProductWavelengthDto })
  wavelength!: ProductWavelengthDto;
}

export class ProductResponseDto {
  @ApiProperty({ example: "product-digital-shield", type: String })
  id!: string;

  @ApiProperty({ example: "digital-shield-pro", type: String })
  slug!: string;

  @ApiProperty({ example: "OPTIQIS Digital Shield Pro", type: String })
  name!: string;

  @ApiProperty({ example: "Digital Shield", type: String })
  line!: string;

  @ApiProperty({ example: "Trong kinh loc anh sang xanh chon loc cho nguoi lam viec voi man hinh dai gio.", type: String })
  summary!: string;

  @ApiProperty({ example: ["screen", "office"], type: [String] })
  needs!: string[];

  @ApiProperty({ example: ["1.60", "1.67", "1.74"], type: [String] })
  indexes!: string[];

  @ApiProperty({ example: ["Diamond Nano-S", "Hydrophobic"], type: [String] })
  coatings!: string[];

  @ApiProperty({ example: ["Nano-AR", "Selective Wave Filtering"], type: [String] })
  technologies!: string[];

  @ApiProperty({ example: "https://images.unsplash.com/photo-1511499767150-a48a237f0083", type: String })
  heroImage!: string;

  @ApiProperty({ type: () => ProductSpecsDto })
  specsJson!: ProductSpecsDto;

  @ApiProperty({ example: true, type: Boolean })
  isFeatured!: boolean;
}

export class MedicalExpertResponseDto {
  @ApiProperty({ example: "expert-hoang-nam", type: String })
  id!: string;

  @ApiProperty({ example: "BS. Hoang Nam", type: String })
  name!: string;

  @ApiProperty({ example: "Truong ban Khuc xa", type: String })
  title!: string;

  @ApiProperty({ example: "Chuyen sau kinh da trong va vat lieu high-index", type: String })
  credential!: string;

  @ApiProperty({ example: "Tu van tieu chuan thau kinh, chi so khuc xa, va quy trinh do mat 12 buoc.", type: String })
  bio!: string;
}

export class ArticleBlockResponseDto {
  @ApiProperty({ example: "b1", type: String })
  id!: string;

  @ApiProperty({ enum: ["heading", "paragraph", "callout", "reference"], type: String })
  type!: "heading" | "paragraph" | "callout" | "reference";

  @ApiProperty({ example: "Digital eye strain la gi?", type: String })
  text!: string;
}

export class ArticleResponseDto {
  @ApiProperty({ example: "article-cvs-blue-light", type: String })
  id!: string;

  @ApiProperty({ example: "hoi-chung-cvs-anh-sang-xanh", type: String })
  slug!: string;

  @ApiProperty({ example: "Hoi chung thi giac man hinh: vi sao anh sang xanh khien mat moi?", type: String })
  title!: string;

  @ApiProperty({ example: "Tong quan ve digital eye strain va quy tac 20-20-20.", type: String })
  excerpt!: string;

  @ApiProperty({ type: () => [ArticleBlockResponseDto] })
  contentJson!: ArticleBlockResponseDto[];

  @ApiProperty({ example: "CVS", type: String })
  category!: string;

  @ApiProperty({ example: ["cvs", "anh-sang-xanh"], type: [String] })
  tags!: string[];

  @ApiProperty({ enum: articleStatuses, type: String })
  status!: (typeof articleStatuses)[number];

  @ApiProperty({ example: "Hoi chung CVS va anh sang xanh | OPTIQIS", type: String })
  seoTitle!: string;

  @ApiProperty({ example: "Tim hieu hoi chung thi giac man hinh va giai phap trong kinh.", type: String })
  seoDescription!: string;

  @ApiProperty({ example: 92, type: Number })
  seoScore!: number;

  @ApiProperty({ example: "expert-hoang-nam", type: String })
  authorId!: string;

  @ApiProperty({ example: "expert-mai-anh", type: String })
  reviewerId!: string;

  @ApiPropertyOptional({ example: "2026-05-18T09:00:00.000Z", nullable: true, type: String })
  publishedAt!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  scheduledAt!: string | null;

  @ApiPropertyOptional({ type: () => MedicalExpertResponseDto })
  author?: MedicalExpertResponseDto;

  @ApiPropertyOptional({ type: () => MedicalExpertResponseDto })
  reviewer?: MedicalExpertResponseDto;

  @ApiPropertyOptional({ type: () => [ProductResponseDto] })
  relatedProducts?: ProductResponseDto[];
}

export class ClinicResponseDto {
  @ApiProperty({ example: "clinic-hcm-q1", type: String })
  id!: string;

  @ApiProperty({ example: "OPTIQIS Vision Center Quan 1", type: String })
  name!: string;

  @ApiProperty({ example: "TP. Ho Chi Minh", type: String })
  province!: string;

  @ApiProperty({ example: "Quan 1", type: String })
  district!: string;

  @ApiProperty({ example: "24 Nguyen Hue, Ben Nghe", type: String })
  address!: string;

  @ApiProperty({ example: "1800 6919", type: String })
  hotline!: string;

  @ApiProperty({ example: "08:00 - 20:30", type: String })
  hours!: string;

  @ApiProperty({ example: 10.7758, type: Number })
  lat!: number;

  @ApiProperty({ example: 106.7009, type: Number })
  lng!: number;

  @ApiProperty({ example: ["Do mat 12 buoc", "Tu van Digital Shield"], type: [String] })
  services!: string[];
}

export class SeoCheckResponseDto {
  @ApiProperty({ example: "Meta title nen nam trong khoang 30-70 ky tu", type: String })
  label!: string;

  @ApiProperty({ example: true, type: Boolean })
  passed!: boolean;
}

export class SeoResultResponseDto {
  @ApiProperty({ example: 88, type: Number })
  score!: number;

  @ApiProperty({ example: ["Meta description nen nam trong khoang 140-160 ky tu"], type: [String] })
  warnings!: string[];

  @ApiProperty({ type: () => [SeoCheckResponseDto] })
  checks!: SeoCheckResponseDto[];
}

export class LeadSubmissionResponseDto {
  @ApiProperty({ example: "cld_01HY", type: String })
  id!: string;

  @ApiProperty({ enum: leadStatuses, example: "NEW", type: String })
  status!: string;

  @ApiProperty({ example: "2026-09-29T08:00:00.000Z", type: String })
  createdAt!: string;
}

export class ConsultationLeadResponseDto {
  @ApiProperty({ example: "cld_01HY", type: String })
  id!: string;

  @ApiProperty({ example: "Nguyen Minh Anh", type: String })
  fullName!: string;

  @ApiProperty({ example: "0901234567", type: String })
  phone!: string;

  @ApiPropertyOptional({ example: "minhanh@example.com", nullable: true, type: String })
  email!: string | null;

  @ApiPropertyOptional({ example: "TP. Ho Chi Minh", nullable: true, type: String })
  province!: string | null;

  @ApiPropertyOptional({ example: "Quan 1", nullable: true, type: String })
  district!: string | null;

  @ApiPropertyOptional({ example: "product-digital-shield", nullable: true, type: String })
  productId!: string | null;

  @ApiPropertyOptional({ example: "OPTIQIS Digital Shield Pro", nullable: true, type: String })
  productName!: string | null;

  @ApiPropertyOptional({ example: "clinic-hcm-q1", nullable: true, type: String })
  clinicId!: string | null;

  @ApiPropertyOptional({ example: "Cuoi tuan", nullable: true, type: String })
  preferredTime!: string | null;

  @ApiPropertyOptional({ example: "Can tu van trong kinh chong anh sang xanh", nullable: true, type: String })
  note!: string | null;

  @ApiProperty({ enum: leadSources, example: "PRODUCT_DETAIL", type: String })
  source!: string;

  @ApiProperty({ enum: leadStatuses, example: "NEW", type: String })
  status!: string;

  @ApiProperty({ example: "2026-09-29T08:00:00.000Z", type: String })
  createdAt!: string;

  @ApiProperty({ example: "2026-09-29T08:00:00.000Z", type: String })
  updatedAt!: string;
}

export class UserResponseDto {
  @ApiProperty({ example: "user-admin-1", type: String })
  id!: string;

  @ApiProperty({ example: "admin@optiqis.vn", type: String })
  email!: string;

  @ApiProperty({ example: "System Admin", type: String })
  name!: string;

  @ApiProperty({ enum: userRoles, type: String })
  role!: (typeof userRoles)[number];

  @ApiPropertyOptional({ example: "Giam doc Ky thuat Platform", nullable: true, type: String })
  title?: string | null;

  @ApiPropertyOptional({ example: "https://images.unsplash.com/photo-1534528741775-53994a69daeb", nullable: true, type: String })
  avatarUrl?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ example: "optiqis_jwt_eyJpZCI6InVzZXItYWRtaW4tMSJ9", type: String })
  token!: string;
}

export class DeleteResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  success!: boolean;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400, type: Number })
  statusCode!: number;

  @ApiProperty({ example: "Validation failed", type: String })
  message!: string;

  @ApiProperty({ example: "Bad Request", type: String })
  error!: string;
}
