import { prisma } from "../../lib/prisma";
import { UpdateSettingsInput } from "./settings.schemas";

/**
 * CompanySettings is a singleton table (always exactly one row). getSettings()
 * lazily creates the default row on first access so the app works out of the
 * box even before an admin visits the Settings page.
 */
export const settingsService = {
  async getSettings() {
    const existing = await prisma.companySettings.findFirst();
    if (existing) return existing;
    return prisma.companySettings.create({ data: {} });
  },

  async updateSettings(input: UpdateSettingsInput) {
    const current = await this.getSettings();
    return prisma.companySettings.update({ where: { id: current.id }, data: input });
  },
};
