import { RolesGuard } from './roles.guard'
import { Reflector } from '@nestjs/core'
import { ForbiddenException } from '@nestjs/common'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: jest.Mocked<Reflector>

  beforeEach(() => {
    reflector = { get: jest.fn() } as any
    guard = new RolesGuard(reflector)
  })

  function makeContext(userRole: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole, id: 1, tenantId: 1, storeId: 1 } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any
  }

  it('allow jika tidak ada role requirement (public route)', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined)
    expect(guard.canActivate(makeContext('kasir'))).toBe(true)
  })

  it('allow jika role user ada di allowed roles', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['admin'])
    expect(guard.canActivate(makeContext('admin'))).toBe(true)
  })

  it('allow jika salah satu role match (multi role)', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['admin_store', 'kasir'])
    expect(guard.canActivate(makeContext('kasir'))).toBe(true)
    expect(guard.canActivate(makeContext('admin_store'))).toBe(true)
  })

  it('throw ForbiddenException jika role tidak match', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['admin'])
    expect(() => guard.canActivate(makeContext('kasir'))).toThrow(ForbiddenException)
  })

  it('throw ForbiddenException owner akses endpoint admin', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['admin'])
    expect(() => guard.canActivate(makeContext('owner'))).toThrow(ForbiddenException)
  })

  it('throw ForbiddenException kasir akses endpoint owner', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['owner'])
    expect(() => guard.canActivate(makeContext('kasir'))).toThrow(ForbiddenException)
  })
})
