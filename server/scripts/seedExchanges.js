import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Exchange from '../models/Exchange.js'

dotenv.config()

const seedExchanges = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing exchanges (optional)
    await Exchange.deleteMany({})
    console.log('🗑️ Cleared existing exchanges')

    // Use the specific company ID from environment
    const companyId = process.env.COMPANY_ID || '6911b5596b7b9676d53ed1d5'
    const sampleCompanyId = new mongoose.Types.ObjectId(companyId)
    const sampleUserId = new mongoose.Types.ObjectId()

    // Sample exchanges data
    const exchangesData = [
      {
        name: 'Binance',
        currentAmount: 125000.50,
        companyId: sampleCompanyId,
        clients: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 50000,
            previousBalance: 75000.50,
            newBalance: 125000.50,
            performedBy: sampleUserId,
            performedByName: 'Admin User',
            note: 'Initial funding for Binance',
            createdAt: new Date('2024-01-15T10:30:00Z')
          }
        ]
      },
      {
        name: 'Bybit',
        currentAmount: 87500.25,
        companyId: sampleCompanyId,
        clients: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 30000,
            previousBalance: 57500.25,
            newBalance: 87500.25,
            performedBy: sampleUserId,
            performedByName: 'Admin User',
            note: 'Monthly funding for Bybit',
            createdAt: new Date('2024-01-10T14:20:00Z')
          }
        ]
      },
      {
        name: 'OKX',
        currentAmount: 95750.75,
        companyId: sampleCompanyId,
        clients: [new mongoose.Types.ObjectId()],
        transactions: []
      },
      {
        name: 'KuCoin',
        currentAmount: 62300.00,
        companyId: sampleCompanyId,
        clients: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 25000,
            previousBalance: 37300.00,
            newBalance: 62300.00,
            performedBy: sampleUserId,
            performedByName: 'Admin User',
            note: 'Weekly funding for KuCoin',
            createdAt: new Date('2024-01-08T09:15:00Z')
          }
        ]
      },
      {
        name: 'Gate.io',
        currentAmount: 43200.80,
        companyId: sampleCompanyId,
        clients: [new mongoose.Types.ObjectId()],
        transactions: []
      },
      {
        name: 'Huobi',
        currentAmount: 78900.45,
        companyId: sampleCompanyId,
        clients: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 40000,
            previousBalance: 38900.45,
            newBalance: 78900.45,
            performedBy: sampleUserId,
            performedByName: 'Admin User',
            note: 'Quarterly funding for Huobi',
            createdAt: new Date('2024-01-12T16:45:00Z')
          }
        ]
      },
      {
        name: 'Coinbase',
        currentAmount: 156780.90,
        companyId: sampleCompanyId,
        clients: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        transactions: [
          {
            type: 'ADD_FUNDS',
            amount: 75000,
            previousBalance: 81780.90,
            newBalance: 156780.90,
            performedBy: sampleUserId,
            performedByName: 'Admin User',
            note: 'Major funding for Coinbase',
            createdAt: new Date('2024-01-20T11:00:00Z')
          }
        ]
      },
      {
        name: 'Kraken',
        currentAmount: 34500.60,
        companyId: sampleCompanyId,
        clients: [new mongoose.Types.ObjectId()],
        transactions: []
      }
    ]

    // Insert exchanges
    const createdExchanges = await Exchange.insertMany(exchangesData)
    
    console.log(`✅ Created ${createdExchanges.length} exchanges:`)
    createdExchanges.forEach(exchange => {
      console.log(`   - ${exchange.name}: $${exchange.currentAmount.toLocaleString()}`)
    })

    console.log('\n📊 Sample data created successfully!')
    console.log(`🏢 Company ID: ${sampleCompanyId}`)
    console.log(`👤 Sample User ID: ${sampleUserId}`)
    
  } catch (error) {
    console.error('❌ Error seeding exchanges:', error)
  } finally {
    // Close connection
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  }
}

// Run the seed function
seedExchanges()