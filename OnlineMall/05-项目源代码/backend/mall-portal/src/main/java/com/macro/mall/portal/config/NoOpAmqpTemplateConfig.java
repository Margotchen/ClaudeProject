package com.macro.mall.portal.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * 当未接入 RabbitMQ 时，提供一个占位 AmqpTemplate，避免取消订单组件启动失败。
 * 仅用于本地无 RabbitMQ 的开发环境。
 */
@Configuration
public class NoOpAmqpTemplateConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(NoOpAmqpTemplateConfig.class);

    @Bean
    @ConditionalOnMissingBean(AmqpTemplate.class)
    public AmqpTemplate noOpAmqpTemplate() {
        return (AmqpTemplate) Proxy.newProxyInstance(
                AmqpTemplate.class.getClassLoader(),
                new Class<?>[]{AmqpTemplate.class},
                new InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        if (method.getName().startsWith("send") || method.getName().startsWith("convertAndSend")) {
                            LOGGER.warn("RabbitMQ 未启用，消息发送被忽略：{}");
                            return null;
                        }
                        if (method.getName().startsWith("receive") || method.getName().startsWith("convertSendAndReceive")) {
                            return null;
                        }
                        if ("toString".equals(method.getName()) && args == null) {
                            return "NoOpAmqpTemplate";
                        }
                        if ("equals".equals(method.getName()) && args != null && args.length == 1) {
                            return proxy == args[0];
                        }
                        if ("hashCode".equals(method.getName()) && args == null) {
                            return System.identityHashCode(proxy);
                        }
                        throw new AmqpException("RabbitMQ 未启用，不支持调用：" + method.getName());
                    }
                }
        );
    }
}
