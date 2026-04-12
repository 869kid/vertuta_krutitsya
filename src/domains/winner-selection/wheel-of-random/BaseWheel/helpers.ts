import { WheelItem, WheelItemWithAngle } from '@models/wheel.model.ts';

const defineAngle = (items: WheelItem[]) => {
  let angleOffset = 0;
  const count = items.length || 1;
  return items.map<WheelItemWithAngle>((item) => {
    const angle = (2 * Math.PI) / count;
    const resultItem = {
      ...item,
      startAngle: angleOffset,
      endAngle: angleOffset + angle,
      name: item.name,
    };
    angleOffset = resultItem.endAngle;

    return resultItem;
  });
};

const selectorAngle = (Math.PI / 2) * 3;
const getWheelAngle = (rotate: number): number => {
  const degree = 360 - (rotate % 360);
  const angle = (degree * Math.PI) / 180 + selectorAngle;

  return angle > Math.PI * 2 ? angle - Math.PI * 2 : angle;
};

const wheelHelpers = {
  defineAngle,
  getWheelAngle,
};

export default wheelHelpers;
