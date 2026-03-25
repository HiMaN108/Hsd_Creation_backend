import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginateConfig, PaginateQuery } from 'nestjs-paginate';
import { validateAndExtractDtColumns } from '../helpers/datatable.helper';
import { EntityManager, ObjectType } from 'typeorm';
import {
  DataTableRequestDto,
  DtColumnDto,
  DtOrderDto,
} from '../dto/data-table-request.dto';

export interface PaginateQueryDt extends PaginateQuery {
  draw?: number;
  /** Validated sortable column names derived from the request */
  dtSortable?: string[];
  /** Validated searchable column names derived from the request */
  dtSearchable?: string[];
}

export const PaginateDataTable = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginateQueryDt => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ url: string; body: DataTableRequestDto }>();
    const body: DataTableRequestDto =
      request.body || ({} as DataTableRequestDto);

    const columns: DtColumnDto[] = body.columns ?? [];
    const order: DtOrderDto[] = body.order ?? [];

    const sortBy: [string, 'ASC' | 'DESC'][] = [];
    for (const o of order) {
      if (o.column === undefined) continue;
      const col: DtColumnDto | undefined = columns[o.column];
      if (col && typeof col.data === 'string' && col.data !== '') {
        if (col.orderable !== false) {
          sortBy.push([
            col.data,
            (o.dir || 'asc').toUpperCase() as 'ASC' | 'DESC',
          ]);
        }
      }
    }

    const filter: Record<string, string | string[]> = {};
    for (const col of columns) {
      if (typeof col.data !== 'string' || col.data === '') continue;
      if (col.searchable !== false && col.search?.value) {
        filter[col.data] = col.search.value;
      }
    }

    /* ── Derive sortable / searchable lists ────────────────────── */
    const dtSortable: string[] = [];
    const dtSearchable: string[] = [];
    for (const col of columns) {
      if (typeof col.data !== 'string' || col.data === '') continue;
      if (col.orderable !== false) dtSortable.push(col.data);
      if (col.searchable !== false) dtSearchable.push(col.data);
    }

    const start = body.start || 0;
    const length = body.length || 10;

    let globalSearch = body.search?.value || undefined;
    if (globalSearch) {
      const activeRegex = /\bactive\b/i;
      const inactiveRegex = /\binactive\b/i;

      if (inactiveRegex.test(globalSearch)) {
        filter['active'] = '0';
        globalSearch = globalSearch
          .replace(inactiveRegex, '')
          .replace(/\s+/g, ' ')
          .trim();
      } else if (activeRegex.test(globalSearch)) {
        filter['active'] = '1';
        globalSearch = globalSearch
          .replace(activeRegex, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    const query: PaginateQueryDt = {
      path: request.url,
      page: Math.floor(start / length) + 1,
      limit: length,
      search: globalSearch || undefined,
      sortBy,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      draw: body.draw,
      dtSortable,
      dtSearchable,
    };

    return query;
  },
);

export function validateAndBuildConfig<T>(
  query: PaginateQueryDt,
  manager: EntityManager,
  entity: ObjectType<T>,
  extraConfig?: Partial<PaginateConfig<T>>,
): PaginateConfig<T> {
  const metadata = manager.connection.getMetadata(entity);
  const entityColumns = new Set(metadata.columns.map((c) => c.propertyName));

  /* Build a minimal columns array for the shared validator */
  const allColumnNames = new Set([
    ...(query.dtSortable ?? []),
    ...(query.dtSearchable ?? []),
  ]);

  const fakeColumns: DtColumnDto[] = [...allColumnNames].map((col) => ({
    data: col,
    orderable: (query.dtSortable ?? []).includes(col),
    searchable: (query.dtSearchable ?? []).includes(col),
  }));

  const fakeBody = {
    draw: query.draw ?? 1,
    start: 0,
    length: query.limit ?? 10,
    columns: fakeColumns,
  };

  const { sortable, searchable } = validateAndExtractDtColumns(
    fakeBody,
    entityColumns,
  );

  const filterableColumns: Record<string, any> = {};
  for (const col of searchable) {
    filterableColumns[col] = true;
  }

  // Ensure 'active' is filterable if it exists in the entity
  if (entityColumns.has('active')) {
    filterableColumns['active'] = true;
  }

  return {
    sortableColumns: sortable,
    searchableColumns: searchable,
    defaultSortBy: [['created_at', 'DESC']],
    filterableColumns: filterableColumns,
    maxLimit: 100,
    defaultLimit: 10,
    ...extraConfig,
  } as PaginateConfig<T>;
}
