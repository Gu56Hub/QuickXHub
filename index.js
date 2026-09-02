const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// เก็บข้อมูล Key ชั่วคราวในหน่วยความจำ (ยังไม่ใช้ Database)
const keys = new Map();

client.once('ready', () => {
  console.log(`บอทออนไลน์แล้ว: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // คำสั่ง /redeem
  if (interaction.commandName === 'redeem') {
    const key = interaction.options.getString('key');
    const hwid = interaction.options.getString('hwid');

    if (!keys.has(key)) {
      return interaction.reply({ content: '❌ Key ไม่ถูกต้อง', ephemeral: true });
    }

    const data = keys.get(key);

    if (data.used) {
      if (data.hwid === hwid) {
        return interaction.reply({ content: '✅ Key นี้ผูกกับ HWID ของคุณอยู่แล้ว', ephemeral: true });
      } else {
        return interaction.reply({ content: '❌ Key นี้ถูกใช้ไปแล้วกับ HWID อื่น', ephemeral: true });
      }
    }

    // ผูก HWID
    data.used = true;
    data.hwid = hwid;
    keys.set(key, data);

    const embed = new EmbedBuilder()
      .setTitle('✅ Redeem สำเร็จ')
      .setDescription(`**Key:** \`\( {key}\`\n**HWID:** \` \){hwid}\``)
      .setColor(0x00FF00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // คำสั่ง /genkey (สร้าง Key)
  if (interaction.commandName === 'genkey') {
    const newKey = 'KEY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    keys.set(newKey, { used: false, hwid: null });

    await interaction.reply({
      content: `สร้าง Key ใหม่แล้ว:\n\`${newKey}\``,
      ephemeral: true
    });
  }
});

// ลงทะเบียน Slash Command
const commands = [
  new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem Key + ผูก HWID')
    .addStringOption(opt => opt.setName('key').setDescription('ใส่ Key').setRequired(true))
    .addStringOption(opt => opt.setName('hwid').setDescription('ใส่ HWID').setRequired(true)),
  new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('สร้าง Key ใหม่')
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('กำลังลงทะเบียนคำสั่ง...');
    await rest.put(
      Routes.applicationCommands('1544580878351736873'),
      { body: commands }
    );
    console.log('ลงทะเบียนคำสั่งเสร็จแล้ว');
  } catch (error) {
    console.error(error);
  }
})();

client.login(process.env.TOKEN);
