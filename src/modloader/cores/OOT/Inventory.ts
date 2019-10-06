import IMemory from 'modloader64_api/IMemory';
import {
  InventoryItem,
  Ocarina,
  Hookshot,
  AmmoUpgrade,
  IInventory,
  Wallet,
  Strength,
  ZoraScale,
  InventorySlots,
} from 'modloader64_api/OOT/OOTAPI';
import { FlagManager } from 'modloader64_api/FlagManager';
import { JSONTemplate } from 'modloader64_api/JSONTemplate';
import { ILogger } from 'modloader64_api/IModLoaderAPI';

export class Inventory extends JSONTemplate implements IInventory {
  private emulator: IMemory;
  private instance: number = global.ModLoader.save_context;
  private inventory_addr: number = this.instance + 0x0074;
  private inventory_ammo_addr: number = this.instance + 0x008c;
  private inventory_upgrades_addr: number = this.instance + 0x00a0;
  private log: ILogger;
  jsonFields: string[] = [
    'dekuSticks',
    'dekuNuts',
    'bombs',
    'bombchus',
    'magicBeans',
    'fairySlingshot',
    'fairyBow',
    'fireArrows',
    'iceArrows',
    'lightArrows',
    'dinsFire',
    'faroresWind',
    'nayrusLove',
    'ocarina',
    'hookshot',
    'boomerang',
    'lensOfTruth',
    'megatonHammer',
    'bottle_1',
    'bottle_2',
    'bottle_3',
    'bottle_4',
    'childTradeItem',
    'adultTradeItem',
    'wallet',
    'quiver',
    'bulletBag',
    'bombBag',
    'dekuNutsCapacity',
    'dekuSticksCapacity',
    'swimming',
    'strength',
  ];

  constructor(emu: IMemory, log: ILogger) {
    super();
    this.emulator = emu;
    this.log = log;
  }

  set strength(bb: Strength) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x3
    );
    switch (bb) {
      case Strength.NONE:
        buf[0x0] = 0x00;
        buf[0x1] = 0x00;
        break;
      case Strength.GORON_BRACELET:
        buf[0x0] = 0x01;
        buf[0x1] = 0x00;
        break;
      case Strength.SILVER_GAUNTLETS:
        buf[0x0] = 0x00;
        buf[0x1] = 0x01;
        break;
      case Strength.GOLDEN_GAUNTLETS:
        buf[0x0] = 0x01;
        buf[0x1] = 0x01;
        break;
    }
    this.emulator.rdramWriteBitsBuffer(this.inventory_upgrades_addr + 0x3, buf);
  }

  get strength(): Strength {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x3
    );
    let str = buf.slice(0, 2).toString('hex');
    switch (str) {
      case '0000':
        return Strength.NONE;
      case '0001':
        return Strength.GORON_BRACELET;
      case '0100':
        return Strength.SILVER_GAUNTLETS;
      case '0101':
        return Strength.GOLDEN_GAUNTLETS;
    }
    return Strength.NONE;
  }

  set swimming(bb: ZoraScale) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x2
    );
    switch (bb) {
      case ZoraScale.NONE:
        buf[0x5] = 0x00;
        buf[0x6] = 0x00;
        break;
      case ZoraScale.SILVER:
        buf[0x5] = 0x00;
        buf[0x6] = 0x01;
        break;
      case ZoraScale.GOLDEN:
        buf[0x5] = 0x01;
        buf[0x6] = 0x00;
        break;
    }
    this.emulator.rdramWriteBitsBuffer(this.inventory_upgrades_addr + 0x2, buf);
  }

  get swimming(): ZoraScale {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x2
    );
    let str = buf.slice(5, 7).toString('hex');
    switch (str) {
      case '0000':
        return ZoraScale.NONE;
      case '0001':
        return ZoraScale.SILVER;
      case '0100':
        return ZoraScale.GOLDEN;
    }
    return ZoraScale.NONE;
  }

  set dekuSticksCapacity(bb: AmmoUpgrade) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x1
    );
    switch (bb) {
      case AmmoUpgrade.NONE:
        buf[0x5] = 0x00;
        buf[0x6] = 0x00;
        break;
      case AmmoUpgrade.BASE:
        buf[0x5] = 0x00;
        buf[0x6] = 0x01;
        break;
      case AmmoUpgrade.UPGRADED:
        buf[0x5] = 0x01;
        buf[0x6] = 0x00;
        break;
      case AmmoUpgrade.MAX:
        buf[0x5] = 0x01;
        buf[0x6] = 0x01;
        break;
    }
    this.emulator.rdramWriteBitsBuffer(this.inventory_upgrades_addr + 0x1, buf);
  }

  get dekuSticksCapacity(): AmmoUpgrade {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x1
    );
    let str = buf.slice(5, 7).toString('hex');
    switch (str) {
      case '0000':
        return AmmoUpgrade.NONE;
      case '0001':
        return AmmoUpgrade.BASE;
      case '0100':
        return AmmoUpgrade.UPGRADED;
      case '0101':
        return AmmoUpgrade.MAX;
    }
    return AmmoUpgrade.NONE;
  }

  set dekuNutsCapacity(bb: AmmoUpgrade) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x1
    );
    switch (bb) {
      case AmmoUpgrade.NONE:
        buf[0x2] = 0x00;
        buf[0x3] = 0x00;
        break;
      case AmmoUpgrade.BASE:
        buf[0x2] = 0x00;
        buf[0x3] = 0x01;
        break;
      case AmmoUpgrade.UPGRADED:
        buf[0x2] = 0x01;
        buf[0x3] = 0x00;
        break;
      case AmmoUpgrade.MAX:
        buf[0x2] = 0x01;
        buf[0x3] = 0x01;
        break;
    }
    this.emulator.rdramWriteBitsBuffer(this.inventory_upgrades_addr + 0x1, buf);
  }

  get dekuNutsCapacity(): AmmoUpgrade {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x1
    );
    let str = buf.slice(2, 4).toString('hex');
    switch (str) {
      case '0000':
        return AmmoUpgrade.NONE;
      case '0001':
        return AmmoUpgrade.BASE;
      case '0100':
        return AmmoUpgrade.UPGRADED;
      case '0101':
        return AmmoUpgrade.MAX;
    }
    return AmmoUpgrade.NONE;
  }

  set bombBag(bb: AmmoUpgrade) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x3
    );
    switch (bb) {
      case AmmoUpgrade.NONE:
        buf[0x3] = 0x00;
        buf[0x4] = 0x00;
        break;
      case AmmoUpgrade.BASE:
        buf[0x3] = 0x00;
        buf[0x4] = 0x01;
        break;
      case AmmoUpgrade.UPGRADED:
        buf[0x3] = 0x01;
        buf[0x4] = 0x00;
        break;
      case AmmoUpgrade.MAX:
        buf[0x3] = 0x01;
        buf[0x4] = 0x01;
        break;
    }
    this.emulator.rdramWriteBitsBuffer(this.inventory_upgrades_addr + 0x3, buf);
  }

  get bombBag(): AmmoUpgrade {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x3
    );
    let str = buf.slice(3, 5).toString('hex');
    switch (str) {
      case '0000':
        return AmmoUpgrade.NONE;
      case '0001':
        return AmmoUpgrade.BASE;
      case '0100':
        return AmmoUpgrade.UPGRADED;
      case '0101':
        return AmmoUpgrade.MAX;
    }
    return AmmoUpgrade.NONE;
  }

  get bulletBag(): AmmoUpgrade {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x2
    );
    let str = buf.slice(0, 2).toString('hex');
    switch (str) {
      case '0000':
        return AmmoUpgrade.NONE;
      case '0001':
        return AmmoUpgrade.BASE;
      case '0100':
        return AmmoUpgrade.UPGRADED;
      case '0101':
        return AmmoUpgrade.MAX;
    }
    return AmmoUpgrade.NONE;
  }

  set bulletBag(bb: AmmoUpgrade) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x2
    );
    switch (bb) {
      case AmmoUpgrade.NONE:
        buf[0x0] = 0x00;
        buf[0x1] = 0x00;
        break;
      case AmmoUpgrade.BASE:
        buf[0x0] = 0x00;
        buf[0x1] = 0x01;
        break;
      case AmmoUpgrade.UPGRADED:
        buf[0x0] = 0x01;
        buf[0x1] = 0x00;
        break;
      case AmmoUpgrade.MAX:
        buf[0x0] = 0x01;
        buf[0x1] = 0x01;
        break;
    }
    this.emulator.rdramWriteBitsBuffer(this.inventory_upgrades_addr + 0x2, buf);
  }

  get quiver(): AmmoUpgrade {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x3
    );
    let str = buf.slice(6, 8).toString('hex');
    switch (str) {
      case '0000':
        return AmmoUpgrade.NONE;
      case '0001':
        return AmmoUpgrade.BASE;
      case '0100':
        return AmmoUpgrade.UPGRADED;
      case '0101':
        return AmmoUpgrade.MAX;
    }
    return AmmoUpgrade.NONE;
  }

  set quiver(q: AmmoUpgrade) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x3
    );
    switch (q) {
      case AmmoUpgrade.NONE:
        buf[0x6] = 0x00;
        buf[0x7] = 0x00;
        break;
      case AmmoUpgrade.BASE:
        buf[0x6] = 0x00;
        buf[0x7] = 0x01;
        break;
      case AmmoUpgrade.UPGRADED:
        buf[0x6] = 0x01;
        buf[0x7] = 0x01;
        break;
      case AmmoUpgrade.MAX:
        buf[0x6] = 0x01;
        buf[0x7] = 0x01;
        break;
    }
    this.emulator.rdramWriteBits8(this.inventory_upgrades_addr + 0x3, buf);
  }

  get wallet(): Wallet {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x2
    );
    let str = buf.slice(2, 4).toString('hex');
    switch (str) {
      case '0000':
        return Wallet.CHILD;
      case '0001':
        return Wallet.ADULT;
      case '0100':
        return Wallet.GIANT;
      case '0101':
        return Wallet.TYCOON;
    }
    return Wallet.CHILD;
  }

  set wallet(w: Wallet) {
    let buf: Buffer = this.emulator.rdramReadBits8(
      this.inventory_upgrades_addr + 0x2
    );
    switch (w) {
      case Wallet.CHILD:
        buf[0x2] = 0x00;
        buf[0x3] = 0x00;
        break;
      case Wallet.ADULT:
        buf[0x2] = 0x00;
        buf[0x3] = 0x01;
        break;
      case Wallet.GIANT:
        buf[0x2] = 0x10;
        buf[0x3] = 0x00;
        break;
      case Wallet.TYCOON:
        buf[0x2] = 0x01;
        buf[0x3] = 0x01;
    }
    this.emulator.rdramWriteBits8(this.inventory_upgrades_addr + 0x2, buf);
  }

  get dekuSticks(): boolean {
    return this.hasItem(InventoryItem.DEKU_STICK);
  }
  set dekuSticks(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.DEKU_STICK, InventorySlots.DEKU_STICKS);
    } else {
      this.removeItem(InventoryItem.DEKU_STICK);
    }
  }
  get dekuSticksCount(): number {
    return this.getAmmoForItem(InventoryItem.DEKU_STICK);
  }
  set dekuSticksCount(count: number) {
    let slot = this.getSlotForItem(InventoryItem.DEKU_STICK);
    this.setAmmoInSlot(slot, count);
  }
  get dekuNuts(): boolean {
    return this.hasItem(InventoryItem.DEKU_NUT);
  }
  set dekuNuts(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.DEKU_NUT, InventorySlots.DEKU_NUTS);
    } else {
      this.removeItem(InventoryItem.DEKU_NUT);
    }
  }
  get dekuNutsCount(): number {
    return this.getAmmoForItem(InventoryItem.DEKU_NUT);
  }
  set dekuNutsCount(count: number) {
    let slot = this.getSlotForItem(InventoryItem.DEKU_NUT);
    this.setAmmoInSlot(slot, count);
  }
  get bombs(): boolean {
    return this.hasItem(InventoryItem.BOMB);
  }
  set bombs(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.BOMB, InventorySlots.BOMBS);
    } else {
      this.removeItem(InventoryItem.BOMB);
    }
  }
  get bombsCount(): number {
    return this.getAmmoForItem(InventoryItem.BOMB);
  }
  set bombsCount(count: number) {
    let slot = this.getSlotForItem(InventoryItem.BOMB);
    this.setAmmoInSlot(slot, count);
  }
  get bombchus(): boolean {
    return this.hasItem(InventoryItem.BOMBCHU);
  }
  set bombchus(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.BOMBCHU, InventorySlots.BOMBCHUS);
    } else {
      this.removeItem(InventoryItem.BOMBCHU);
    }
  }
  get bombchuCount(): number {
    return this.getAmmoForItem(InventoryItem.BOMBCHU);
  }
  set bombchuCount(count: number) {
    let slot = this.getSlotForItem(InventoryItem.BOMBCHU);
    this.setAmmoInSlot(slot, count);
  }
  get magicBeans(): boolean {
    return this.hasItem(InventoryItem.MAGIC_BEAN);
  }
  set magicBeans(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.MAGIC_BEAN, InventorySlots.MAGIC_BEANS);
    } else {
      this.removeItem(InventoryItem.MAGIC_BEAN);
    }
  }
  get magicBeansCount(): number {
    return this.getAmmoForItem(InventoryItem.MAGIC_BEAN);
  }
  set magicBeansCount(count: number) {
    let slot = this.getSlotForItem(InventoryItem.MAGIC_BEAN);
    this.setAmmoInSlot(slot, count);
  }
  get fairySlingshot(): boolean {
    return this.hasItem(InventoryItem.FAIRY_SLINGSHOT);
  }
  set fairySlingshot(bool: boolean) {
    if (bool) {
      this.giveItem(
        InventoryItem.FAIRY_SLINGSHOT,
        InventorySlots.FAIRY_SLINGSHOT
      );
    } else {
      this.removeItem(InventoryItem.FAIRY_SLINGSHOT);
    }
  }
  get dekuSeeds(): number {
    return this.getAmmoForItem(InventoryItem.FAIRY_SLINGSHOT);
  }
  set dekuSeeds(count: number) {
    let slot = this.getSlotForItem(InventoryItem.FAIRY_SLINGSHOT);
    this.setAmmoInSlot(slot, count);
  }
  get fairyBow(): boolean {
    return this.hasItem(InventoryItem.FAIRY_BOW);
  }
  set fairyBow(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.FAIRY_BOW, InventorySlots.FAIRY_BOW);
    } else {
      this.removeItem(InventoryItem.FAIRY_BOW);
    }
  }
  get arrows(): number {
    return this.getAmmoForItem(InventoryItem.FAIRY_BOW);
  }
  set arrows(count: number) {
    let slot = this.getSlotForItem(InventoryItem.FAIRY_BOW);
    this.setAmmoInSlot(slot, count);
  }
  get fireArrows(): boolean {
    return this.hasItem(InventoryItem.FIRE_ARROW);
  }
  set fireArrows(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.FIRE_ARROW, InventorySlots.FIRE_ARROWS);
    } else {
      this.removeItem(InventoryItem.FIRE_ARROW);
    }
  }
  get iceArrows(): boolean {
    return this.hasItem(InventoryItem.ICE_ARROW);
  }
  set iceArrows(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.ICE_ARROW, InventorySlots.ICE_ARROWS);
    } else {
      this.removeItem(InventoryItem.ICE_ARROW);
    }
  }
  get lightArrows(): boolean {
    return this.hasItem(InventoryItem.LIGHT_ARROW);
  }
  set lightArrows(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.LIGHT_ARROW, InventorySlots.LIGHT_ARROWS);
    } else {
      this.removeItem(InventoryItem.LIGHT_ARROW);
    }
  }
  get dinsFire(): boolean {
    return this.hasItem(InventoryItem.DINS_FIRE);
  }
  set dinsFire(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.DINS_FIRE, InventorySlots.DINS_FIRE);
    } else {
      this.removeItem(InventoryItem.DINS_FIRE);
    }
  }
  get faroresWind(): boolean {
    return this.hasItem(InventoryItem.FARORES_WIND);
  }
  set faroresWind(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.FARORES_WIND, InventorySlots.FARORES_WIND);
    } else {
      this.removeItem(InventoryItem.FARORES_WIND);
    }
  }
  get nayrusLove(): boolean {
    return this.hasItem(InventoryItem.NAYRUS_LOVE);
  }
  set nayrusLove(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.NAYRUS_LOVE, InventorySlots.NAYRUS_LOVE);
    } else {
      this.removeItem(InventoryItem.NAYRUS_LOVE);
    }
  }
  get ocarina(): Ocarina {
    if (this.hasItem(InventoryItem.OCARINA_OF_TIME)) {
      return Ocarina.OCARINA_OF_TIME;
    }
    if (this.hasItem(InventoryItem.FAIRY_OCARINA)) {
      return Ocarina.FAIRY_OCARINA;
    }
    return Ocarina.NONE;
  }
  set ocarina(item: Ocarina) {
    if (item == this.ocarina) {
      return;
    }
    if (item == Ocarina.NONE) {
      this.removeItem(InventoryItem.OCARINA_OF_TIME);
      this.removeItem(InventoryItem.FAIRY_OCARINA);
    }
    if (item == Ocarina.OCARINA_OF_TIME) {
      let slot: number = this.getSlotForItem(InventoryItem.FAIRY_OCARINA);
      if (slot > -1) {
        this.setItemInSlot(InventoryItem.OCARINA_OF_TIME, slot);
      } else {
        this.giveItem(InventoryItem.OCARINA_OF_TIME, InventorySlots.OCARINA);
      }
    }
    if (item == Ocarina.FAIRY_OCARINA) {
      let slot: number = this.getSlotForItem(InventoryItem.OCARINA_OF_TIME);
      if (slot > -1) {
        this.setItemInSlot(InventoryItem.FAIRY_OCARINA, slot);
      } else {
        this.giveItem(InventoryItem.FAIRY_OCARINA, InventorySlots.OCARINA);
      }
    }
  }
  get hookshot(): Hookshot {
    if (this.hasItem(InventoryItem.LONGSHOT)) {
      return Hookshot.LONGSHOT;
    }
    if (this.hasItem(InventoryItem.HOOKSHOT)) {
      return Hookshot.LONGSHOT;
    }
    return Hookshot.NONE;
  }
  set hookshot(item: Hookshot) {
    if (item == this.hookshot) {
      return;
    }
    if (item == Hookshot.NONE) {
      this.removeItem(InventoryItem.HOOKSHOT);
      this.removeItem(InventoryItem.LONGSHOT);
    }
    if (item == Hookshot.LONGSHOT) {
      let slot: number = this.getSlotForItem(InventoryItem.HOOKSHOT);
      if (slot > -1) {
        this.setItemInSlot(InventoryItem.LONGSHOT, slot);
      } else {
        this.giveItem(InventoryItem.LONGSHOT, InventorySlots.HOOKSHOT);
      }
    }
    if (item == Hookshot.HOOKSHOT) {
      let slot: number = this.getSlotForItem(InventoryItem.LONGSHOT);
      if (slot > -1) {
        this.setItemInSlot(InventoryItem.HOOKSHOT, slot);
      } else {
        this.giveItem(InventoryItem.HOOKSHOT, InventorySlots.HOOKSHOT);
      }
    }
  }
  get boomerang(): boolean {
    return this.hasItem(InventoryItem.BOOMERANG);
  }
  set boomerang(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.BOOMERANG, InventorySlots.BOOMERANG);
    } else {
      this.removeItem(InventoryItem.BOOMERANG);
    }
  }
  get lensOfTruth(): boolean {
    return this.hasItem(InventoryItem.LENS_OF_TRUTH);
  }
  set lensOfTruth(bool: boolean) {
    if (bool) {
      this.giveItem(InventoryItem.LENS_OF_TRUTH, InventorySlots.LENS_OF_TRUTH);
    } else {
      this.removeItem(InventoryItem.LENS_OF_TRUTH);
    }
  }
  get megatonHammer(): boolean {
    return this.hasItem(InventoryItem.MEGATON_HAMMER);
  }
  set megatonHammer(bool: boolean) {
    if (bool) {
      this.giveItem(
        InventoryItem.MEGATON_HAMMER,
        InventorySlots.MEGATON_HAMMER
      );
    } else {
      this.removeItem(InventoryItem.MEGATON_HAMMER);
    }
  }
  get bottle_1(): InventoryItem {
    return this.getItemInSlot(InventorySlots.BOTTLE1);
  }
  set bottle_1(content: InventoryItem) {
    this.setItemInSlot(content, InventorySlots.BOTTLE1);
  }
  get bottle_2(): InventoryItem {
    return this.getItemInSlot(InventorySlots.BOTTLE2);
  }
  set bottle_2(content: InventoryItem) {
    this.setItemInSlot(content, InventorySlots.BOTTLE2);
  }
  get bottle_3(): InventoryItem {
    return this.getItemInSlot(InventorySlots.BOTTLE3);
  }
  set bottle_3(content: InventoryItem) {
    this.setItemInSlot(content, InventorySlots.BOTTLE3);
  }
  get bottle_4(): InventoryItem {
    return this.getItemInSlot(InventorySlots.BOTTLE4);
  }
  set bottle_4(content: InventoryItem) {
    this.setItemInSlot(content, InventorySlots.BOTTLE4);
  }
  hasBottle(): boolean {
    for (let i = 0; i <= InventorySlots.CHILD_TRADE_ITEM; i++) {
      let item: InventoryItem = this.getItemInSlot(i);
      if (
        item >= InventoryItem.EMPTY_BOTTLE &&
        item <= InventoryItem.BOTTLED_POE
      ) {
        return true;
      }
    }
    return false;
  }
  getBottleCount(): number {
    let bottles = 0;
    for (let i = 0; i <= InventorySlots.CHILD_TRADE_ITEM; i++) {
      let item: InventoryItem = this.getItemInSlot(i);
      if (
        item >= InventoryItem.EMPTY_BOTTLE &&
        item <= InventoryItem.BOTTLED_POE
      ) {
        bottles++;
      }
    }
    return bottles;
  }
  getBottledItems(): InventoryItem[] {
    let bottles: InventoryItem[] = new Array();
    for (let i = 0; i <= InventorySlots.CHILD_TRADE_ITEM; i++) {
      let item: InventoryItem = this.getItemInSlot(i);
      if (
        item >= InventoryItem.EMPTY_BOTTLE &&
        item <= InventoryItem.BOTTLED_POE
      ) {
        bottles.push(item);
      }
    }
    return bottles;
  }
  get childTradeItem(): InventoryItem {
    for (
      let i = InventoryItem.MASK_OF_TRUTH;
      i >= InventoryItem.ZELDAS_LETTER;
      i--
    ) {
      if (this.hasItem(i)) {
        return i;
      }
    }
    if (this.hasItem(InventoryItem.SOLD_OUT)) {
      // More complex logic is required here to grab the last mask the child had
    }
    return InventoryItem.NONE;
  }
  set childTradeItem(item: InventoryItem) {
    // More complex logic is required here because of flags
  }
  get adultTradeItem(): InventoryItem {
    for (
      let i = InventoryItem.CLAIM_CHECK;
      i >= InventoryItem.POCKET_EGG;
      i--
    ) {
      if (i == InventoryItem.SOLD_OUT) {
        continue;
      }
      if (this.hasItem(i)) {
        return i;
      }
    }
    return InventoryItem.NONE;
  }
  set adultTradeItem(item: InventoryItem) {
    // More complex logic is required here because of flags
  }
  isChildTradeFinished(): boolean {
    // This is going to require more complex flag checks
    return true;
  }
  isAdultTradeFinished(): boolean {
    // This should be done with flags also
    return true;
  }
  getItemInSlot(slotId: number): InventoryItem {
    if (slotId < 0 || slotId > 23) {
      return InventoryItem.NONE;
    }
    let itemId: number = this.emulator.rdramRead8(this.inventory_addr + slotId);
    return itemId as InventoryItem;
  }
  getSlotForItem(item: InventoryItem): number {
    for (let i = 0; i <= InventorySlots.CHILD_TRADE_ITEM; i++) {
      if (this.getItemInSlot(i) == item) {
        return i;
      }
    }
    return -1;
  }
  getSlotsForItem(item: InventoryItem): number[] {
    let slots: number[] = new Array();
    for (let i = 0; i <= InventorySlots.CHILD_TRADE_ITEM; i++) {
      if (this.getItemInSlot(i) == item) {
        slots.push(i);
      }
    }
    return slots;
  }
  hasItem(item: InventoryItem): boolean {
    return this.getSlotForItem(item) != -1;
  }
  getAmmoForItem(item: InventoryItem): number {
    if (!this.hasAmmo(item)) {
      return 0;
    }
    let ammo = 0;
    let slots: number[] = this.getSlotsForItem(item);
    for (let i = 0; i < slots.length; i++) {
      ammo += this.getAmmoForSlot(slots[i]);
    }
    return ammo;
  }
  hasAmmo(item: InventoryItem): boolean {
    switch (item) {
      case InventoryItem.DEKU_STICK:
      case InventoryItem.DEKU_NUT:
      case InventoryItem.FAIRY_SLINGSHOT:
      case InventoryItem.FAIRY_BOW:
      case InventoryItem.BOMB:
      case InventoryItem.BOMBCHU:
      case InventoryItem.MAGIC_BEAN:
        return true;
    }
    return false;
  }
  getAmmoForSlot(slotId: number): number {
    if (slotId < 0 || slotId > 0xf) {
      return 0;
    }
    return this.emulator.rdramRead8(this.inventory_ammo_addr + slotId);
  }
  setAmmoInSlot(slot: number, amount: number): void {
    if (slot < 0 || slot >= 0xf) {
      return;
    }
    this.emulator.rdramWrite8(this.inventory_ammo_addr + slot, amount);
  }
  setItemInSlot(item: InventoryItem, slot: number): void {
    if (slot < 0 || slot > InventorySlots.CHILD_TRADE_ITEM) {
      return;
    }
    this.emulator.rdramWrite8(this.inventory_addr + slot, item.valueOf());
  }
  giveItem(item: InventoryItem, desiredSlot: InventorySlots) {
    if (
      this.getItemInSlot(desiredSlot) == InventoryItem.NONE ||
      this.getItemInSlot(desiredSlot) == item
    ) {
      this.setItemInSlot(item, desiredSlot);
    }
  }
  removeItem(item: InventoryItem): void {
    let slots = this.getSlotsForItem(item);
    for (let i = 0; i < slots.length; i++) {
      this.setItemInSlot(InventoryItem.NONE, i);
    }
  }
  getEmptySlots(): number[] {
    let slots: number[] = new Array();
    for (let i = 0; i <= InventorySlots.CHILD_TRADE_ITEM; i++) {
      if (this.getItemInSlot(i) == InventoryItem.NONE) {
        slots.push(i);
      }
    }
    return slots;
  }
}
