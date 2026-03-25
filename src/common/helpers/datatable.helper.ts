/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { EntityManager, ObjectType } from 'typeorm';
import { PaginateConfig, PaginateQuery } from 'nestjs-paginate';
import { DataTableRequestDto } from '../dto/data-table-request.dto';

const BLOCKED_COLUMNS = new Set(['password', 'deleted_at']);

export function getEntityColumnNames<T>(
  manager: EntityManager,
  entity: ObjectType<T>,
): Set<string> {
  const metadata = manager.getRepository(entity).metadata;
  return new Set(metadata.columns.map((c) => c.propertyName));
}

export interface ValidatedDtColumns {
  sortable: string[];
  searchable: string[];
  sortBy: [string, 'ASC' | 'DESC'][];
  filter: Record<string, string | string[]> | undefined;
}

export function validateAndExtractDtColumns(
  body: DataTableRequestDto,
  entityColumns: Set<string>,
): ValidatedDtColumns {
  const invalidColumns: string[] = [];

  for (const col of body.columns) {
    if (typeof col.data !== 'string' || col.data === '') continue;

    if (!entityColumns.has(col.data) || BLOCKED_COLUMNS.has(col.data)) {
      invalidColumns.push(col.data);
    }
  }

  if (invalidColumns.length > 0) {
    throw new BadRequestException(
      `Invalid column(s): ${invalidColumns.join(', ')}`,
    );
  }

  const sortable: string[] = [];
  const searchable: string[] = [];

  for (const col of body.columns) {
    if (typeof col.data !== 'string' || col.data === '') continue;
    if (BLOCKED_COLUMNS.has(col.data)) continue;

    if (col.orderable !== false) sortable.push(col.data);
    if (col.searchable !== false) searchable.push(col.data);
  }

  const sortBy: [string, 'ASC' | 'DESC'][] = [];
  if (body.order) {
    for (const order of body.order) {
      const column = body.columns[order.column];
      if (
        column &&
        typeof column.data === 'string' &&
        column.data !== '' &&
        column.orderable !== false &&
        entityColumns.has(column.data) &&
        !BLOCKED_COLUMNS.has(column.data)
      ) {
        sortBy.push([column.data, order.dir.toUpperCase() as 'ASC' | 'DESC']);
      }
    }
  }

  const filter: Record<string, string | string[]> = {};
  for (const col of body.columns) {
    if (typeof col.data !== 'string' || col.data === '') continue;
    if (BLOCKED_COLUMNS.has(col.data)) continue;

    if (col.searchable !== false && col.search?.value) {
      filter[col.data] = col.search.value;
    }
  }

  return {
    sortable,
    searchable,
    sortBy,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  };
}

export function buildDatatableQuery<T>(
  body: DataTableRequestDto,
  manager: EntityManager,
  entity: ObjectType<T>,
  req: Request,
  extraConfig?: Partial<PaginateConfig<T>>,
): { query: PaginateQuery; config: PaginateConfig<T> } {
  const entityColumns = getEntityColumnNames(manager, entity);
  const { sortable, searchable, sortBy, filter } = validateAndExtractDtColumns(
    body,
    entityColumns,
  );

  const page = Math.floor(body.start / body.length) + 1;

  const query: PaginateQuery = {
    page,
    limit: body.length,
    path: req.url,
    sortBy,
    search: body.search?.value || undefined,
    filter,
  };

  const filterableColumns: Record<string, true> = {};
  for (const col of searchable) {
    filterableColumns[col] = true;
  }

  const config: PaginateConfig<T> = {
    sortableColumns: sortable as any,
    searchableColumns: searchable as any,
    defaultSortBy: [['created_at', 'DESC']] as any,
    filterableColumns: filterableColumns as any,
    maxLimit: 100,
    defaultLimit: 10,
    ...extraConfig,
  };

  return { query, config };
}
