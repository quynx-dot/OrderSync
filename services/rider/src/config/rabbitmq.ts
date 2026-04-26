import ampq from 'amqplib'


let channel:ampq.Channel;

export const connectRabbitMQ=async()=>{
    const connection=await ampq.connect(process.env.RABBITMQ_URL!);
    channel=await connection.createChannel();
    await channel.assertQueue(process.env.RIDER_QUEUE!,{
        durable:true,
    });
    console.log("🐇 connected to Rabbitmq(rider service");
};
export const getChannel=()=>channel;