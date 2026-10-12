import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma, type Product } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(product: Product) {
    return {
      ...product,
      expirationDate: product.expirationDate?.toISOString().slice(0, 10) ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private data(dto: UpdateProductDto) {
    const { expirationDate, ...fields } = dto;
    return {
      ...fields,
      ...(expirationDate === undefined ? {} : {
        expirationDate: expirationDate === null ? null : new Date(`${expirationDate}T00:00:00.000Z`),
      }),
    };
  }

  private failure(error: unknown): never {
    if (error instanceof NotFoundException ||
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) {
      throw new NotFoundException('El producto no existe.');
    }
    throw new InternalServerErrorException('No se pudo completar la operación de productos.');
  }

  async findAll() {
    try {
      const products = await this.prisma.product.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] });
      return products.map(product => this.serialize(product));
    } catch (error) { this.failure(error); }
  }

  async findOne(id: number) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException('El producto no existe.');
      return this.serialize(product);
    } catch (error) { this.failure(error); }
  }

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({ data: { ...this.data(dto), name: dto.name, category: dto.category } });
      return this.serialize(product);
    } catch (error) { this.failure(error); }
  }

  async update(id: number, dto: UpdateProductDto) {
    try {
      return this.serialize(await this.prisma.product.update({ where: { id }, data: this.data(dto) }));
    } catch (error) { this.failure(error); }
  }

  async remove(id: number) {
    try {
      return this.serialize(await this.prisma.product.delete({ where: { id } }));
    } catch (error) { this.failure(error); }
  }
}
