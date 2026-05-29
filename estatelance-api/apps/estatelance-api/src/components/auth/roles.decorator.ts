import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../libs/enums/common.enums';

// Key used to store role metadata on resolver methods
export const ROLES_KEY = 'roles';

// Use this decorator above a resolver method to restrict it to specific roles:
// @Roles(UserType.ADMIN)
// @UseGuards(RolesGuard)
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
