import { ApiProperty } from '@nestjs/swagger';
import { MeResponseDto } from './me-response.dto';

export class PaginatedUsersResponseDto {
  @ApiProperty({ example: 1 })
  schemaVersion!: 1;

  @ApiProperty({ type: [MeResponseDto] })
  items!: MeResponseDto[];

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 25 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}
