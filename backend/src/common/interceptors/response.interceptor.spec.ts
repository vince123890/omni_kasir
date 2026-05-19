import { ResponseInterceptor } from './response.interceptor'
import { of } from 'rxjs'

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor

  beforeEach(() => {
    interceptor = new ResponseInterceptor()
  })

  it('wrap plain data dalam { statusCode, message, data }', (done) => {
    const mockHandler = { handle: () => of({ name: 'test', value: 42 }) }
    const mockCtx = {} as any

    interceptor.intercept(mockCtx, mockHandler).subscribe((result) => {
      expect(result).toEqual({
        statusCode: 200,
        message: 'Berhasil',
        data: { name: 'test', value: 42 },
      })
      done()
    })
  })

  it('tidak double-wrap jika data sudah punya statusCode', (done) => {
    const alreadyFormatted = { statusCode: 201, message: 'Dibuat', data: { id: 1 } }
    const mockHandler = { handle: () => of(alreadyFormatted) }

    interceptor.intercept({} as any, mockHandler).subscribe((result) => {
      expect(result).toEqual(alreadyFormatted)
      expect(result.data).not.toHaveProperty('statusCode')
      done()
    })
  })

  it('wrap array data', (done) => {
    const mockHandler = { handle: () => of([{ id: 1 }, { id: 2 }]) }

    interceptor.intercept({} as any, mockHandler).subscribe((result) => {
      expect(result.data).toEqual([{ id: 1 }, { id: 2 }])
      expect(result.statusCode).toBe(200)
      done()
    })
  })

  it('wrap null data', (done) => {
    const mockHandler = { handle: () => of(null) }

    interceptor.intercept({} as any, mockHandler).subscribe((result) => {
      expect(result.data).toBeNull()
      done()
    })
  })
})
