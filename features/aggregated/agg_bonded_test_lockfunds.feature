Feature: aggregate bonded tx test lockfunds

    Scenario Outline: aggregate bonded tx test lockfunds
        Given "<alice_privatekey>" wants to buy a ticket from "<ticketcounter_privatekey>" "<ticketcounter_publickey>" through a "<ticketdistributor_privatekey>" "<ticketdistributor_publickey>" on "<host_url>"
        When alice creates a transfer tx to ticket distributor
        And ticket distributor creates a transfer tx to ticket counter
        Then alice wraps all the tx in an aggregate bonded transaction, signs the transaction
        And alice creates a lockfunds tx to avoid network spamming and signs lock funds tx
        And Alice announces the lock funds tx and after its confirmation, aggregate bonded tx is announced

        Examples:
            | host_url                        | alice_privatekey                                                 | ticketdistributor_privatekey                                     | ticketdistributor_publickey                                      | ticketcounter_privatekey                                         | ticketcounter_publickey                                          |
            | http://catapult48gh23s.xyz:3000 | 8589CBBCBAF5046F4C47CC1A715A37BC20548B4A6A5F44564B23929E9782D968 | 196586E30D54F3060267CAD48980D876704F5D8CEE3EB1C466BA72C0099B5C2C | 7E125231F8AB434716BFC72A892113AA410FE661CFB767CC00B7B1F0BF8AF34E | B6824BE72093E8BB3EF992F957539CF0D72522D37918A4B9224151C9F0B8B615 | 5F5EBAEC1C8015B6C7AD5E021AA16AF475E74D3047156A180A3B096422D1112E |
