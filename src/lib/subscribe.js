// 全局的一些事件订阅
const events = {};

export const subscribeEvent = (name, event, id) => {
  // 订阅事件
  if (id) {
    // 相同事件 多个监听
    if (!events[name]) {
      events[name] = {};
    }
    events[name][id] = event;
  } else {
    events[name] = event;
  }
};

export const unSubscribeEvent = (name, id) => {
  // 取消订阅
  if (id) {
    delete events[name][id];
  } else {
    delete events[name];
  }
};

export const notify = (name, data) => {
  // 通知事件触发
  const event = events[name];
  if (typeof event === 'function') {
    event(data);
  } else {
    Object.keys(event || {}).forEach((e) => {
      event[e](data);
    });
  }
};

window.notify = notify;
