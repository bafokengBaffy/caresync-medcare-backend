package health.caresync.billing.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * RabbitMQ topology for billing events.
 *
 * OWASP notes:
 * - Messages use JSON converter with no polymorphic type info (safe deserialization).
 * - DLQ enabled to avoid poison messages blocking the queue.
 * - Durable queues/exchanges so events survive broker restart.
 */
@Configuration
@Profile({"prod", "gcp", "rabbit"})
public class BillingRabbitMQConfig {

    @Value("${caresync.billing.rabbit.exchange:caresync.billing}")
    private String exchangeName;

    @Value("${caresync.billing.rabbit.queue.invoice-issued:caresync.billing.invoice.issued}")
    private String invoiceIssuedQueue;

    @Value("${caresync.billing.rabbit.queue.payment-received:caresync.billing.payment.received}")
    private String paymentReceivedQueue;

    @Value("${caresync.billing.rabbit.routing.invoice-issued:invoice.issued}")
    private String invoiceIssuedRoutingKey;

    @Value("${caresync.billing.rabbit.routing.payment-received:payment.received}")
    private String paymentReceivedRoutingKey;

    private static final String DLX = "caresync.billing.dlx";

    @Bean
    public DirectExchange billingExchange() {
        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange billingDeadLetterExchange() {
        return new DirectExchange(DLX, true, false);
    }

    @Bean
    public Queue invoiceIssuedQueue() {
        return QueueBuilder.durable(invoiceIssuedQueue)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "invoice.issued.dlq")
                .build();
    }

    @Bean
    public Queue paymentReceivedQueue() {
        return QueueBuilder.durable(paymentReceivedQueue)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "payment.received.dlq")
                .build();
    }

    @Bean
    public Binding invoiceIssuedBinding(Queue invoiceIssuedQueue, DirectExchange billingExchange) {
        return BindingBuilder.bind(invoiceIssuedQueue).to(billingExchange).with(invoiceIssuedRoutingKey);
    }

    @Bean
    public Binding paymentReceivedBinding(Queue paymentReceivedQueue, DirectExchange billingExchange) {
        return BindingBuilder.bind(paymentReceivedQueue).to(billingExchange).with(paymentReceivedRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        // Non-polymorphic, trusted packages disabled -> prevents gadget-chain RCE (CVE class).
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        converter.setCreateMessageIds(true);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}